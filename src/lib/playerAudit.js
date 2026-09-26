import { getFromStorage, setStorage } from './storage';
import { getSteamBans, getSteamSummaries, getSteamGameHours, getSteamLevel } from './steamApi';
import { resolveSteamId } from './steamIdResolver';

const CACHE_KEY = 'playerAuditCache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

// Níveis de risco
export const RISK_LEVEL = {
  CLEAN: 'clean', // 🟢 Sem problemas
  SUSPECT: 'suspect', // 🟡 Indicadores suspeitos
  BANNED: 'banned', // 🔴 Banimento confirmado
  CONFIG: 'config' // ⚙️ Chave Steam não configurada
};

export async function auditPlayers( gcPlayerIds ) {
  // 1. Buscar API key do storage
  const { steamApiKey } = await getApiKeys();

  // 2. Resolver SteamIDs e URLs do GC
  const resolvedList = await Promise.all(
    gcPlayerIds.map( id => resolveSteamId( id, steamApiKey ) )
  );

  // Se não temos Steam API Key, retornamos os links do csREP sem dados detalhados da Steam
  if ( !steamApiKey ) {
    return gcPlayerIds.map( ( gcId, i ) => {
      const res = resolvedList[i];
      if ( !res ) { return { gcId, error: 'Could not resolve steam ID' }; }
      return {
        gcId,
        steamId: res.steamId,
        steamUrl: res.rawSteamUrl,
        csrepUrl: res.csrepUrl,
        riskLevel: RISK_LEVEL.CONFIG,
        noApiKey: true
      };
    } );
  }

  const steamIds = resolvedList.map( res => res?.steamId || null );

  // 3. Verificar cache de audit
  const cache = await getFromStorage( CACHE_KEY ) || {};

  const uncachedIds = steamIds.filter( id => id && ( !cache[id] || cache[id].ttl < Date.now() ) );

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

  // 4. Consultar APIs em paralelo (batch para Bans e Summaries)
  const [ bans, summaries ] = await Promise.all( [
    getSteamBans( steamApiKey, uncachedIds ),
    getSteamSummaries( steamApiKey, uncachedIds )
  ] );

  // 5. Para cada jogador, buscar horas de CS2 + nível Steam (em paralelo)
  const detalhes = await Promise.all( uncachedIds.map( async steamId => {
    const [ hours, level ] = await Promise.all( [
      getSteamGameHours( steamApiKey, steamId ).catch( () => null ),
      getSteamLevel( steamApiKey, steamId ).catch( () => null )
    ] );
    return { steamId, hours, level };
  } ) );

  // 6. Montar resultado e calcular risco
  const results = uncachedIds.map( steamId => {
    const ban = bans.find( b => b.SteamId === steamId ) || {};
    const summary = summaries.find( s => s.steamid === steamId ) || {};
    const detail = detalhes.find( d => d.steamId === steamId ) || {};
    const resolved = resolvedList.find( r => r?.steamId === steamId );

    const audit = {
      steamId,
      // Dados de ban
      vacBanned: ban.VACBanned || false,
      numberOfVACBans: ban.NumberOfVACBans || 0,
      daysSinceLastBan: ban.DaysSinceLastBan || 0,
      numberOfGameBans: ban.NumberOfGameBans || 0,
      communityBanned: ban.CommunityBanned || false,
      economyBan: ban.EconomyBan || 'none',
      // Dados de perfil
      personaName: summary.personaname || '???',
      profileVisibility: summary.communityvisibilitystate || 1,
      accountCreated: summary.timecreated || null,
      avatarUrl: summary.avatarmedium || '',
      // Dados de jogo
      cs2Hours: detail.hours ? Math.round( detail.hours.totalMinutes / 60 ) : null,
      cs2RecentHours: detail.hours ? Math.round( detail.hours.recentMinutes / 60 ) : null,
      steamLevel: detail.level,
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

  // 7. Salvar no cache
  const updatedCache = { ...cache };
  results.forEach( r => { updatedCache[r.steamId] = r; } );
  await setStorage( CACHE_KEY, updatedCache );

  // 8. Retornar array de auditorias
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
}

function calcularRisco( audit ) {
  if ( audit.vacBanned ) { return RISK_LEVEL.BANNED; }
  if ( audit.numberOfGameBans > 0 ) { return RISK_LEVEL.BANNED; }
  if ( audit.communityBanned ) { return RISK_LEVEL.BANNED; }

  let suspectCount = 0;
  const ageDays = audit.accountCreated ?
    Math.floor( ( ( Date.now() / 1000 ) - audit.accountCreated ) / 86400 ) :
    null;
  if ( ageDays !== null && ageDays < 180 ) { suspectCount++; }
  if ( audit.cs2Hours !== null && audit.cs2Hours < 150 ) { suspectCount++; }
  if ( audit.steamLevel !== null && audit.steamLevel <= 2 ) { suspectCount++; }
  if ( audit.profileVisibility === 1 ) { suspectCount++; }
  if ( audit.economyBan !== 'none' ) { suspectCount++; }

  if ( suspectCount >= 2 ) { return RISK_LEVEL.SUSPECT; }
  return RISK_LEVEL.CLEAN;
}

function calcularMotivos( audit ) {
  const motivos = [];
  if ( audit.vacBanned ) { motivos.push( `⛔ VAC Ban (${audit.numberOfVACBans}x, há ${audit.daysSinceLastBan} dias)` ); }
  if ( audit.numberOfGameBans > 0 ) { motivos.push( `⛔ Game Ban (${audit.numberOfGameBans}x)` ); }
  if ( audit.communityBanned ) { motivos.push( '⛔ Community Ban' ); }

  const ageDays = audit.accountCreated ?
    Math.floor( ( ( Date.now() / 1000 ) - audit.accountCreated ) / 86400 ) :
    null;
  if ( ageDays !== null && ageDays < 180 ) { motivos.push( `⚠️ Conta com apenas ${ageDays} dias` ); }
  if ( audit.cs2Hours !== null && audit.cs2Hours < 150 ) { motivos.push( `⚠️ Apenas ${audit.cs2Hours}h de CS2` ); }
  if ( audit.steamLevel !== null && audit.steamLevel <= 2 ) { motivos.push( `⚠️ Steam Level ${audit.steamLevel}` ); }
  if ( audit.profileVisibility === 1 ) { motivos.push( '⚠️ Perfil privado' ); }
  if ( audit.economyBan !== 'none' && audit.economyBan !== '' ) { motivos.push( '⚠️ Economy Ban ativo' ); }

  return motivos;
}

async function getApiKeys() {
  return new Promise( resolve => {
    chrome.storage.sync.get( [ 'steamApiKey' ], result => {
      resolve( { steamApiKey: result.steamApiKey || null } );
    } );
  } );
}
