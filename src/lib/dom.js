export function getUserInfo() {

  const scripts = document.querySelectorAll( 'script' );

  const hjRegex = /window\.hj\('identify',\s*userId,\s*({[\s\S]*?})\s*\)/;
  const currentUserRegex = /window\.currentUser\s*=\s*({[\s\S]*?})\s*;/;

  for ( const script of scripts ) {

    const content = script.textContent;
    if ( !content ) { continue; }

    const hjMatch = content.match( hjRegex );

    if ( hjMatch?.[1] ) {
      try {
        const normalized = hjMatch[1].replace( /'/g, '"' );
        return JSON.parse( normalized );
      } catch ( err ) {
        console.warn( '[GC Booster] Falha ao parsear dados do Hotjar.', err );
      }
    }

    const currentUserMatch = content.match( currentUserRegex );

    if ( currentUserMatch?.[1] ) {
      try {
        const normalized = currentUserMatch[1].replace( /'/g, '"' );
        const user = JSON.parse( normalized );

        return {
          plID: user?.id ?? null,
          ...user
        };
      } catch ( err ) {
        console.warn( '[GC Booster] Falha ao parsear window.currentUser.', err );
      }
    }

  }

  if ( window.currentUser ) {
    return {
      plID: window.currentUser?.id ?? null,
      ...window.currentUser
    };
  }

  console.warn( '[GC Booster] Não foi possível extrair as informações do usuário.' );

  return { plID: null };
}

export const log = msg => console.log( '[GC Booster]', msg );

export function getLobbiesLimit() {
  const match = document.documentElement.innerHTML.match( /var LOBBIES_LIMIT =\s(\d*)/ );
  if ( !match ) {
    console.warn( '[GC Booster] Não foi possível extrair o limite de lobbies.' );
    return null;
  }
  return Number( match[1] );
}
