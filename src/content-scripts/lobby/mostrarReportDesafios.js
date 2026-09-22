import { getPlayerInfo } from './getPlayerInfo';

const PLAYER_REPORT_CLASS = 'gcbooster-player-reported';
const PROCESSED_ATTR = 'data-gcbooster-report-checked';

let isFeatureEnabled = null;



/**
 * Marca visualmente um jogador individual como reportado no lineup.
 */
const marcarJogadorReportado = playerLink => {
  if ( playerLink.classList.contains( PLAYER_REPORT_CLASS ) ) { return; }
  playerLink.classList.add( PLAYER_REPORT_CLASS );

  // Garante que o elemento pai tenha position relative para o indicator absoluto
  if ( window.getComputedStyle( playerLink ).position === 'static' ) {
    playerLink.style.position = 'relative';
  }

  const indicator = document.createElement( 'div' );
  indicator.className = 'gcbooster-player-report-indicator';
  indicator.title = 'Anotação negativa';
  indicator.setAttribute( 'data-tip-text', 'Anotação negativa' );
  // Ícone de anotação negativa (documento com ponta dobrada)
  indicator.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff3b3b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 4h16v11l-5 5H4V4z"></path>
      <path d="M15 15v5h5"></path>
    </svg>
  `;
  playerLink.prepend( indicator );
};

const processarJogador = async playerLink => {
  if ( playerLink.getAttribute( PROCESSED_ATTR ) ) { return; }
  playerLink.setAttribute( PROCESSED_ATTR, 'processing' );

  const match = playerLink.href.match( /\/player\/(\d+)/i );
  const playerId = match ? match[1] : playerLink.href.split( '/' ).filter( Boolean ).pop();
  if ( !playerId || isNaN( playerId ) ) {
    playerLink.removeAttribute( PROCESSED_ATTR );
    return;
  }

  try {
    const info = await getPlayerInfo( playerId );
    if ( info && info.anotacao === 'Negativa' ) {
      marcarJogadorReportado( playerLink );
    }
  } catch ( _e ) {
    // do nothing
  }

  playerLink.setAttribute( PROCESSED_ATTR, 'true' );
};

/**
 * Observer para detectar cards de jogadores na DOM.
 */
export const mostrarReportDesafios = mutations => {
  if ( isFeatureEnabled === false ) { return; }

  $.each( mutations, ( _, mutation ) => {
    $( mutation.addedNodes )
      .find( 'a.LobbyPlayerVertical, .sala-lineup-imagem a' )
      .addBack( 'a.LobbyPlayerVertical, .sala-lineup-imagem a' )
      .each( ( _, element ) => {
        processarJogador( element );
      } );
  } );
};

export const mostrarReportDesafiosInit = () => {
  chrome.storage.sync.get( [ 'mostrarReportDesafios' ], result => {
    isFeatureEnabled = result.mostrarReportDesafios !== false; // Default to true or let user toggle it
  } );
};
