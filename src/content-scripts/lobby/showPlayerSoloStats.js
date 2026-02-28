import { GC_URL, headers as auth, showPlayerSoloStatsConsts } from '../../lib/constants';

const { PLAYERS_IDS_DEBUG, DEBUG_PLAYERS } = showPlayerSoloStatsConsts;

async function fetchJSON( url, useAuth = false, extraHeaders = {} ) {
  try {
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...extraHeaders
    };

    if ( useAuth && auth?.Authorization ) {
      headers['Authorization'] = auth.Authorization;
    }

    const response = await fetch( url, {
      method: 'GET',
      headers,
      credentials: 'include'
    } );

    if ( !response.ok ) {
      throw new Error( `HTTP error! status: ${response.status}` );
    }

    return await response.json();
  } catch ( error ) {
    console.error(
      `[GC-BOOSTER] Falha ao buscar dados da URL: ${url}\n→ Erro: ${error.message}`
    );
    return null;
  }
}

async function getPlayerStats( id ) {
  const matches = await fetchJSON(
    `https://${GC_URL}/api/box/history/${id}/maps`,
    true
  );

  if ( !matches || !Array.isArray( matches ) || matches.length === 0 ) {
    return { id, winRate: 0, matches: 0, wins: 0, period: 'Total' };
  }

  const wins = matches.reduce( ( acc, m ) => acc + ( m.win ? 1 : 0 ), 0 );

  const winRate =
    matches.length > 0 ? ( wins / matches.length ) * 100 : 0;

  return {
    id,
    winRate: parseFloat( winRate.toFixed( 2 ) ),
    matches: matches.length,
    wins,
    period: 'Total'
  };
}

function isSoloDraftScreen() {
  const text = document.body?.innerText?.toLowerCase() || '';

  const hasDraftText =
    text.includes( 'escolhem os jogadores' ) ||
    text.includes( 'select their players' );

  const triggerCount =
    document.querySelectorAll( 'div[id^="trigger-"]' ).length;

  return hasDraftText && triggerCount >= 5;
}

export function showPlayerSoloStats() {
  chrome.storage.sync.get( [ 'disableShowPlayerSoloStats' ], function ( result ) {
    if ( result.disableShowPlayerSoloStats ) { return; }
    let playerIds = [];
    const processLobby = async () => {

      let wrappers = [];

      if ( DEBUG_PLAYERS ) {
        playerIds = PLAYERS_IDS_DEBUG;
      } else {
        if ( !isSoloDraftScreen() ) { return; }

        wrappers = Array.from(
          document.querySelectorAll( 'div[id^="trigger-"]' )
        ).map( trigger => trigger.closest( 'div[class*="PlayerCardWrapper"]' ) )
          .filter( Boolean );

        playerIds = wrappers.map( wrapper => {
          const trigger = wrapper.querySelector( 'div[id^="trigger-"]' );
          if ( !trigger ) { return null; }

          const match = trigger.id.match( /trigger-(\d+)/ );
          return match ? parseInt( match[1], 10 ) : null;
        } ).filter( Boolean );

        if ( !playerIds.length ) { return; }
      }

      const results = await Promise.allSettled(
        playerIds.map( id => getPlayerStats( id ) )
      );

      const statsMap = {};
      const debugTable = [];

      results.forEach( res => {
        if ( res.status === 'fulfilled' && res.value ) {
          const stat = res.value;
          statsMap[stat.id] = stat;

          debugTable.push( {
            ID: stat.id,
            Partidas: stat.matches,
            Vitórias: stat.wins,
            'WR (%)': stat.winRate
          } );
        }
      } );

      if ( DEBUG_PLAYERS ) {
        console.log( '[GC-BOOSTER] Estatísticas Solo (Debug):' );
        console.table( debugTable );
      }

      if ( !DEBUG_PLAYERS ) {
        wrappers.forEach( wrapper => {
          const trigger = wrapper.querySelector( 'div[id^="trigger-"]' );
          const card = wrapper.querySelector(
            'div[data-test^="div:playerCard:"]'
          );

          if ( !trigger || !card ) { return; }

          const match = trigger.id.match( /trigger-(\d+)/ );
          if ( !match ) { return; }

          const id = parseInt( match[1], 10 );
          const stat = statsMap[id];
          if ( !stat ) { return; }

          const badgesContainer = card.querySelector(
            '[data-test="div:player-identity-badges"]'
          );

          if ( !badgesContainer ) { return; }
          if ( badgesContainer.querySelector( '.gc-solo-stats-badge' ) ) { return; }

          const badge = document.createElement( 'span' );
          badge.className = 'gc-solo-stats-badge';
          badge.textContent = `${stat.winRate}%`;

          Object.assign( badge.style, {
            background: 'oklch(70% 0.22 50)',
            color: '#fff',
            padding: '2px 6px',
            fontSize: '10px',
            fontWeight: 'bold',
            marginRight: '8px',
            userSelect: 'none',
            display: 'inline-block',
            position: 'relative',
            cursor: 'default'
          } );

          const tooltip = document.createElement( 'div' );
          tooltip.textContent = `Vitórias (${stat.wins}/${stat.matches})`;

          Object.assign( tooltip.style, {
            position: 'absolute',
            bottom: '125%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#111',
            color: '#fff',
            padding: '6px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            opacity: '0',
            pointerEvents: 'none',
            transition: 'opacity 0.15s ease',
            zIndex: '9999',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
          } );

          badge.appendChild( tooltip );
          badge.addEventListener( 'mouseenter', () => {
            tooltip.style.opacity = '1';
          } );

          badge.addEventListener( 'mouseleave', () => {
            tooltip.style.opacity = '0';
          } );

          badgesContainer.appendChild( badge );
        } );
      }
    };

    if ( !DEBUG_PLAYERS ) {
      const observer = new MutationObserver( () => {
        if ( isSoloDraftScreen() && !window._gcSoloStatsProcessing ) {
          window._gcSoloStatsProcessing = true;

          setTimeout( async () => {
            await processLobby();
            window._gcSoloStatsProcessing = false;
          }, 600 );
        }
      } );

      observer.observe( document.body, {
        childList: true,
        subtree: true
      } );

      // fallback inicial
      setTimeout( () => {
        if ( isSoloDraftScreen() ) { processLobby(); }
      }, 1500 );

    } else {
      setTimeout( processLobby, 1500 );
    }
  } );
}
