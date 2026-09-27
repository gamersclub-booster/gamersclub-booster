import { resolveVanityViaXml } from './steamApi';
import { getFromStorage, setStorage } from './storage';

const RESOLVER_CACHE_KEY = 'gc_steam_resolver_cache';

export async function resolveSteamId( gcPlayerId ) {
  if ( !gcPlayerId ) { return null; }

  // 1. Verificar cache local primeiro
  try {
    const cache = await getFromStorage( RESOLVER_CACHE_KEY ) || {};
    if ( cache[gcPlayerId]?.steamId ) {
      return { ...cache[gcPlayerId], fromCache: true };
    }
  } catch ( _e ) {
    // Falha silenciosa ao ler cache de resolver
  }

  // 2. Buscar da página da GamersClub
  try {
    const response = await fetch( `https://gamersclub.com.br/player/${gcPlayerId}` );
    const html = await response.text();

    const steamMatch = html.match(
      /https?:\/\/(?:www\.)?steamcommunity\.com\/(profiles\/(\d{17})|id\/([a-zA-Z0-9_-]+))/i
    );
    if ( !steamMatch ) { return null; }

    const fullUrl = steamMatch[0];
    const steamIdDirect = steamMatch[2];
    const vanityName = steamMatch[3];

    let steamId = steamIdDirect || null;

    if ( !steamId && vanityName ) {
      steamId = await resolveVanityViaXml( vanityName );
    }

    const csrepUrl = fullUrl.replace(
      /https?:\/\/(?:www\.)?steamcommunity\.com/i,
      'https://wsteamcommunity.com'
    );

    const result = {
      steamId,
      rawSteamUrl: fullUrl,
      csrepUrl: steamId ? `https://csrep.gg/player/${steamId}` : csrepUrl
    };

    // 3. Salvar no cache se resolveu com sucesso
    if ( steamId ) {
      try {
        const cache = await getFromStorage( RESOLVER_CACHE_KEY ) || {};
        cache[gcPlayerId] = result;
        await setStorage( RESOLVER_CACHE_KEY, cache );
      } catch ( _e ) {
        // Falha silenciosa ao gravar cache de resolver
      }
    }

    return result;
  } catch ( error ) {
    console.error( `Error resolving steam ID for GC player ${gcPlayerId}:`, error );
    return null;
  }
}
