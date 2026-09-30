import { getFromStorage, setStorage } from './storage';
import { getSteamProfileXml, getSteamMiniprofile } from './steamApi';
import { resolveSteamId } from './steamIdResolver';

const CACHE_KEY = 'playerAuditCache_v2';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

// Níveis de risco
export const RISK_LEVEL = {
  CLEAN: 'clean', // 🟢 Sem problemas
  SUSPECT: 'suspect', // 🟡 Indicadores suspeitos
  BANNED: 'banned' // 🔴 Banimento confirmado
};

export async function invalidateCache( ids ) {
  if ( !ids || !Array.isArray( ids ) || ids.length === 0 ) { return; }
  try {
    const cache = await getFromStorage( CACHE_KEY ) || {};
    const resolverCache = await getFromStorage( 'gc_steam_resolver_cache' ) || {};

    const steamIdsToPurge = new Set();
    ids.forEach( id => {
      if ( !id ) { return; }
      steamIdsToPurge.add( String( id ) );
      if ( resolverCache[id]?.steamId ) {
        steamIdsToPurge.add( String( resolverCache[id].steamId ) );
      }
    } );

    steamIdsToPurge.forEach( sId => {
      delete cache[sId];
    } );
    await setStorage( CACHE_KEY, cache );
  } catch ( error ) {
    console.error( '[GC Booster] Erro ao invalidar cache de audit:', error );
  }
}

export async function auditPlayers( gcPlayerIds ) {
  if ( !gcPlayerIds || !Array.isArray( gcPlayerIds ) || gcPlayerIds.length === 0 ) {
    return [];
  }

  // Em content scripts (contexto de página web), delega para o background service worker
  // para evitar bloqueios de CORS do navegador na Steam (Manifest V3)
  if ( typeof window !== 'undefined' && window.document && chrome.runtime?.id && chrome.runtime?.sendMessage ) {
    return new Promise( resolve => {
      let settled = false;
      const timer = setTimeout( () => {
        if ( !settled ) {
          settled = true;
          console.warn( '[GC Booster] Timeout no background worker para audit, executando direto.' );
          resolve( auditPlayersDirect( gcPlayerIds ) );
        }
      }, 8000 );

      try {
        chrome.runtime.sendMessage( { action: 'AUDIT_PLAYERS', gcPlayerIds }, response => {
          if ( settled ) { return; }
          settled = true;
          clearTimeout( timer );

          if ( chrome.runtime?.lastError ) {
            console.warn( '[GC Booster] Erro ao comunicar com background worker:', chrome.runtime.lastError.message );
            return resolve( auditPlayersDirect( gcPlayerIds ) );
          }
          if ( response?.success && Array.isArray( response.data ) ) {
            return resolve( response.data );
          }
          console.warn( '[GC Booster] Resposta inesperada do background worker:', response );
          resolve( auditPlayersDirect( gcPlayerIds ) );
        } );
      } catch ( _e ) {
        if ( !settled ) {
          settled = true;
          clearTimeout( timer );
          resolve( auditPlayersDirect( gcPlayerIds ) );
        }
      }
    } );
  }

  return auditPlayersDirect( gcPlayerIds );
}

let auditQueuePromise = Promise.resolve();

export async function auditPlayersDirect( gcPlayerIds ) {
  const execute = async () => {
    // Limpar cache corrompido antigo se existir
    try {
      chrome.storage.local.remove( 'playerAuditCache' );
    } catch ( _e ) {
      // Ignora erro ao limpar cache antigo
    }

    // 1. Resolver SteamIDs e URLs do GC (sequencial para evitar Rate Limit/Cloudflare)
    const resolvedList = [];
    for ( const id of gcPlayerIds ) {
      const res = await resolveSteamId( id );
      resolvedList.push( res );
      // Se não veio do cache (teve que fazer fetch), adiciona um pequeno delay de 300ms
      if ( res && !res.fromCache ) {
        await new Promise( resolve => setTimeout( resolve, 300 ) );
      }
    }

    const steamIds = resolvedList.map( res => res?.steamId || null );

    // 2. Verificar cache de audit
    const cache = await getFromStorage( CACHE_KEY ) || {};

    const uncachedIds = steamIds.filter( id => {
      if ( !id ) { return false; }
      const cached = cache[id];
      if ( !cached || cached.ttl < Date.now() ) { return true; }
      // Se a entrada no cache estiver sem nome ou corrompida por falha prévia de rede, reconsulta
      if ( cached.personaName === '???' || ( cached.profileVisibility === null && !cached.vacBanned ) ) {
        return true;
      }
      return false;
    } );

    if ( uncachedIds.length === 0 ) {
      return gcPlayerIds.map( ( gcId, i ) => {
        const sId = steamIds[i];
        const res = resolvedList[i];
        if ( !sId ) {
          return {
            gcId,
            csrepUrl: res?.csrepUrl,
            steamUrl: res?.rawSteamUrl,
            error: 'Could not resolve 64-bit Steam ID'
          };
        }
        return { gcId, csrepUrl: res?.csrepUrl, ...cache[sId] };
      } );
    }

    // 3. Consultar endpoints públicos da Steam em paralelo
    const steamDetails = await Promise.all( uncachedIds.map( async steamId => {
      const [ profileXml, miniProfile ] = await Promise.all( [
        getSteamProfileXml( steamId ),
        getSteamMiniprofile( steamId )
      ] );
      return { steamId, profileXml, miniProfile };
    } ) );

    // 4. Montar resultado e calcular risco
    const results = uncachedIds.map( steamId => {
      const detail = steamDetails.find( d => d.steamId === steamId ) || {};
      const xml = detail.profileXml || {};
      const mini = detail.miniProfile || {};
      const resolved = resolvedList.find( r => r?.steamId === steamId );

      const personaName = mini.personaName || xml.personaName || null;
      const profileVisibility = xml.privacyState || ( xml.visibilityState === 3 ? 'public' : 'private' );

      const audit = {
        steamId,
        // Dados de ban
        vacBanned: xml.vacBanned === 1,
        numberOfVACBans: xml.vacBanned === 1 ? 1 : 0,
        daysSinceLastBan: 0,
        numberOfGameBans: 0,
        communityBanned: false,
        economyBan: xml.tradeBanState || 'None',
        // Dados de perfil
        personaName,
        profileVisibility,
        isLimitedAccount: xml.isLimitedAccount === 1,
        // Dados de nível
        steamLevel: mini.level ?? null,
        // Links
        csrepUrl: resolved?.csrepUrl || `https://csrep.gg/player/${steamId}`,
        steamUrl: resolved?.rawSteamUrl || `https://steamcommunity.com/profiles/${steamId}`,
        // Timestamp
        ttl: Date.now() + CACHE_TTL
      };

      audit.riskLevel = calcularRisco( audit );
      audit.riskReasons = calcularMotivos( audit );
      return audit;
    } );

    // 5. Salvar no cache apenas resultados com dados válidos recebidos
    const updatedCache = { ...cache };
    results.forEach( r => {
      if ( r.personaName || r.vacBanned || r.profileVisibility !== null ) {
        updatedCache[r.steamId] = r;
      }
    } );
    await setStorage( CACHE_KEY, updatedCache );

    // 6. Retornar array de auditorias
    return gcPlayerIds.map( ( gcId, i ) => {
      const sId = steamIds[i];
      const res = resolvedList[i];
      if ( !sId ) {
        return {
          gcId,
          csrepUrl: res?.csrepUrl,
          steamUrl: res?.rawSteamUrl,
          error: 'Could not resolve 64-bit Steam ID'
        };
      }
      return {
        gcId,
        csrepUrl: res?.csrepUrl,
        ...( results.find( r => r.steamId === sId ) || cache[sId] )
      };
    } );
  };

  const nextPromise = auditQueuePromise.then( execute, execute );
  auditQueuePromise = nextPromise.catch( () => {} );
  return nextPromise;
}

function calcularRisco( audit ) {
  if ( audit.vacBanned ) { return RISK_LEVEL.BANNED; }
  if ( audit.economyBan && audit.economyBan !== 'None' && audit.economyBan !== 'none' ) { return RISK_LEVEL.BANNED; }

  let suspectCount = 0;
  if ( audit.isLimitedAccount ) { suspectCount++; }
  if ( audit.steamLevel !== null && audit.steamLevel <= 2 ) { suspectCount++; }
  if ( audit.profileVisibility === 'private' || audit.profileVisibility === 'friendsonly' ) { suspectCount++; }

  if ( suspectCount >= 2 ) { return RISK_LEVEL.SUSPECT; }
  return RISK_LEVEL.CLEAN;
}

function calcularMotivos( audit ) {
  const motivos = [];
  if ( audit.vacBanned ) { motivos.push( '⛔ VAC Ban ativo' ); }
  if ( audit.economyBan && audit.economyBan !== 'None' && audit.economyBan !== 'none' && audit.economyBan !== '' ) {
    motivos.push( `⛔ Trade Ban (${audit.economyBan})` );
  }

  if ( audit.isLimitedAccount ) { motivos.push( '⚠️ Conta limitada Steam' ); }
  if ( audit.steamLevel !== null && audit.steamLevel <= 2 ) { motivos.push( `⚠️ Steam Level ${audit.steamLevel}` ); }
  if ( audit.profileVisibility === 'private' ) { motivos.push( '⚠️ Perfil privado' ); }
  if ( audit.profileVisibility === 'friendsonly' ) { motivos.push( '⚠️ Perfil visível apenas para amigos' ); }

  return motivos;
}
