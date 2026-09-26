const STEAM_API_BASE = 'https://api.steampowered.com';
const CS2_APP_ID = 730;

export async function getSteamBans( apiKey, steamIds ) {
  if ( !steamIds || steamIds.length === 0 ) { return []; }
  const url = `${STEAM_API_BASE}/ISteamUser/GetPlayerBans/v1/?key=${apiKey}&steamids=${steamIds.join( ',' )}`;
  try {
    const res = await fetch( url );
    const data = await res.json();
    return data.players || [];
  } catch ( error ) {
    console.error( 'Error fetching steam bans:', error );
    return [];
  }
}

export async function getSteamSummaries( apiKey, steamIds ) {
  if ( !steamIds || steamIds.length === 0 ) { return []; }
  const url = `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamIds.join( ',' )}`;
  try {
    const res = await fetch( url );
    const data = await res.json();
    return data.response?.players || [];
  } catch ( error ) {
    console.error( 'Error fetching steam summaries:', error );
    return [];
  }
}

export async function getSteamGameHours( apiKey, steamId ) {
  if ( !steamId ) { return null; }
  const url = `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamId}&include_appinfo=1&appids_filter[0]=${CS2_APP_ID}`;
  try {
    const res = await fetch( url );
    const data = await res.json();
    const game = data.response?.games?.[0];
    return game ? {
      totalMinutes: game.playtime_forever || 0,
      recentMinutes: game.playtime_2weeks || 0
    } : null;
  } catch ( error ) {
    console.error( `Error fetching game hours for ${steamId}:`, error );
    return null;
  }
}

export async function getSteamLevel( apiKey, steamId ) {
  if ( !steamId ) { return null; }
  const url = `${STEAM_API_BASE}/IPlayerService/GetSteamLevel/v1/?key=${apiKey}&steamid=${steamId}`;
  try {
    const res = await fetch( url );
    const data = await res.json();
    return data.response?.player_level ?? null;
  } catch ( error ) {
    console.error( `Error fetching steam level for ${steamId}:`, error );
    return null;
  }
}

export async function resolveVanityUrl( apiKey, vanityUrl ) {
  if ( !vanityUrl || !apiKey ) { return null; }
  const url = `${STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v1/?key=${apiKey}&vanityurl=${encodeURIComponent( vanityUrl )}`;
  try {
    const res = await fetch( url );
    const data = await res.json();
    return data.response?.success === 1 ? data.response.steamid : null;
  } catch ( error ) {
    console.error( `Error resolving vanity url ${vanityUrl}:`, error );
    return null;
  }
}

