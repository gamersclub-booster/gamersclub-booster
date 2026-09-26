import { resolveVanityUrl } from './steamApi';

export async function resolveSteamId( gcPlayerId, apiKey = null ) {
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

    if ( !steamId && vanityName && apiKey ) {
      steamId = await resolveVanityUrl( apiKey, vanityName );
    }

    const csrepUrl = fullUrl.replace(
      /https?:\/\/(?:www\.)?steamcommunity\.com/i,
      'https://wsteamcommunity.com'
    );

    return {
      steamId,
      rawSteamUrl: fullUrl,
      csrepUrl: steamId ? `https://csrep.gg/player/${steamId}` : csrepUrl
    };
  } catch ( error ) {
    console.error( `Error resolving steam ID for GC player ${gcPlayerId}:`, error );
    return null;
  }
}
