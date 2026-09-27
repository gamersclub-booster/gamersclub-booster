const STEAM_COMMUNITY_BASE = 'https://steamcommunity.com';

function extractXmlTag( xml, tag ) {
  const re = new RegExp( `<${tag}>(?:<\\!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))<\\/${tag}>` );
  const match = re.exec( xml );
  if ( !match ) { return null; }
  return ( match[1] !== undefined ? match[1] : match[2] ).trim();
}

export async function getSteamProfileXml( steamId ) {
  if ( !steamId ) { return null; }
  const url = `${STEAM_COMMUNITY_BASE}/profiles/${steamId}/?xml=1`;
  try {
    const res = await fetch( url );
    if ( !res.ok ) {
      console.error( `[GC Booster] Steam XML profile fetch failed (status ${res.status})` );
      return null;
    }
    const xml = await res.text();
    if ( extractXmlTag( xml, 'error' ) || !xml.includes( '<profile>' ) ) {
      return null;
    }

    const vacBannedStr = extractXmlTag( xml, 'vacBanned' );
    const tradeBanState = extractXmlTag( xml, 'tradeBanState' ) || 'None';
    const isLimitedStr = extractXmlTag( xml, 'isLimitedAccount' );
    const privacyState = extractXmlTag( xml, 'privacyState' ) || 'private';
    const visibilityStateStr = extractXmlTag( xml, 'visibilityState' );
    const personaName = extractXmlTag( xml, 'steamID' );

    return {
      vacBanned: vacBannedStr !== null ? parseInt( vacBannedStr, 10 ) : 0,
      tradeBanState,
      isLimitedAccount: isLimitedStr !== null ? parseInt( isLimitedStr, 10 ) : 0,
      privacyState,
      visibilityState: visibilityStateStr !== null ? parseInt( visibilityStateStr, 10 ) : 1,
      personaName: personaName || null
    };
  } catch ( error ) {
    console.error( `[GC Booster] Error fetching steam profile XML for ${steamId}:`, error );
    return null;
  }
}

export async function getSteamMiniprofile( steamId ) {
  if ( !steamId ) { return null; }
  try {
    const accountId = ( BigInt( steamId ) - 76561197960265728n ).toString();
    const url = `${STEAM_COMMUNITY_BASE}/miniprofile/${accountId}/json`;
    const res = await fetch( url );
    if ( !res.ok ) { return null; }
    const data = await res.json();
    return {
      level: typeof data.level === 'number' ? data.level : null,
      personaName: data.persona_name || null
    };
  } catch ( error ) {
    console.error( `[GC Booster] Error fetching miniprofile for ${steamId}:`, error );
    return null;
  }
}

export async function resolveVanityViaXml( vanityName ) {
  if ( !vanityName ) { return null; }
  const url = `${STEAM_COMMUNITY_BASE}/id/${encodeURIComponent( vanityName )}/?xml=1`;
  try {
    const res = await fetch( url );
    if ( !res.ok ) { return null; }
    const xml = await res.text();
    if ( extractXmlTag( xml, 'error' ) ) { return null; }
    const steamId = extractXmlTag( xml, 'steamID64' );
    return steamId || null;
  } catch ( error ) {
    console.error( `[GC Booster] Error resolving vanity via XML for ${vanityName}:`, error );
    return null;
  }
}
