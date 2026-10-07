import axios from 'axios';
import { getPlayerInfo } from './getPlayerInfo';
import { getPlayerLinks } from '../../lib/playerLinks';
import { createDivPlayers } from './infoLobby';
import { GC_URL } from '../../lib/constants';
import { isExtensionContextValid } from '../../utils';
import { getUserInfo } from '../../lib/dom';

export const isMatchPage = () => {
  const path = window.location.pathname.toLowerCase();
  return path.includes( '/match' ) ||
         path.includes( '/partida' ) ||
         $( '.PlayerListCard' ).length > 0;
};

export const getMatchPlayersFromDOM = () => {
  const teamA = [];
  const teamB = [];

  $( '.PlayerListCard' ).each( ( _, card ) => {
    const $card = $( card );
    let playerId = null;

    // 1. Tentar pegar por trigger-
    const $trigger = $card.find( '[id^="trigger-"]' );
    if ( $trigger.length > 0 ) {
      const match = $trigger.attr( 'id' ).replace( 'trigger-', '' );
      if ( /^\d+$/.test( match ) ) {
        playerId = match;
      }
    }

    // 2. Tentar pegar por link de jogador
    if ( !playerId ) {
      const $playerLink = $card.find( 'a[href*="/jogador/"], a[href*="/player/"]' );
      if ( $playerLink.length > 0 ) {
        const href = $playerLink.attr( 'href' ) || '';
        const match = href.match( /\/(?:jogador|player)\/(\d+)/i );
        if ( match && match[1] ) {
          playerId = match[1];
        }
      }
    }

    // 3. Tentar data-player-id
    if ( !playerId ) {
      const dataId = $card.attr( 'data-player-id' ) || $card.find( '[data-player-id]' ).attr( 'data-player-id' );
      if ( dataId && /^\d+$/.test( dataId ) ) {
        playerId = dataId;
      }
    }

    if ( playerId ) {
      if ( $card.hasClass( 'PlayerListCard--left' ) ) {
        teamA.push( playerId );
      } else {
        teamB.push( playerId );
      }
    }
  } );

  const dedupTeamA = Array.from( new Set( teamA ) );
  const dedupTeamB = Array.from( new Set( teamB ) );

  return {
    teamA: dedupTeamA,
    teamB: dedupTeamB,
    all: Array.from( new Set( [ ...dedupTeamA, ...dedupTeamB ] ) )
  };
};

export const getMatchPlayersFromApi = async () => {
  try {
    const gcHost = GC_URL || window.location.hostname || 'gamersclub.com.br';
    const response = await axios.get( `https://${gcHost}/api/lobby/match` );
    const data = response?.data?.data;
    if ( !data ) { return null; }

    const teamAPlayers = Array.isArray( data.teamA?.players ) ?
      data.teamA.players.map( p => String( p.id ) ).filter( Boolean ) : [];
    const teamBPlayers = Array.isArray( data.teamB?.players ) ?
      data.teamB.players.map( p => String( p.id ) ).filter( Boolean ) : [];

    return {
      teamA: teamAPlayers,
      teamB: teamBPlayers,
      all: Array.from( new Set( [ ...teamAPlayers, ...teamBPlayers ] ) )
    };
  } catch ( _err ) {
    return null;
  }
};

export const getAllMatchPlayers = async () => {
  const domResult = getMatchPlayersFromDOM();
  if ( domResult.teamA.length >= 5 && domResult.teamB.length >= 5 ) {
    return domResult;
  }

  const apiResult = await getMatchPlayersFromApi();
  if ( apiResult ) {
    const teamA = Array.from( new Set( [ ...domResult.teamA, ...apiResult.teamA ] ) );
    const teamB = Array.from( new Set( [ ...domResult.teamB, ...apiResult.teamB ] ) );
    return {
      teamA,
      teamB,
      all: Array.from( new Set( [ ...teamA, ...teamB ] ) )
    };
  }

  return domResult;
};

const closeMatchModal = () => {
  $( '#gcbooster_match_raiox_modal' ).remove();
  $( document ).off( 'keydown.gcbooster_match_modal' );
};

export const openMatchRaioXModal = async ( options = {} ) => {
  const { initialTeam = 'all' } = options;

  const { plID: myPlayerId } = getUserInfo();
  const strMyPlayerId = String( myPlayerId );
  const domPlayers = getMatchPlayersFromDOM();
  const isMyTeamA = strMyPlayerId && domPlayers.teamA.includes( strMyPlayerId );
  const isMyTeamB = strMyPlayerId && domPlayers.teamB.includes( strMyPlayerId );

  closeMatchModal();

  const $overlay = $( '<div />', {
    id: 'gcbooster_match_raiox_modal',
    class: 'gcbooster-match-modal-overlay'
  } );

  const $modal = $( '<div />', {
    class: 'gcbooster-match-modal-container'
  } );

  const $header = $( '<div />', {
    class: 'gcbooster-match-modal-header'
  } );

  const $titleWrap = $( '<div />', { class: 'gcbooster-match-modal-title-wrap' } )
    .append( $( '<span />', {
      class: 'gcbooster-match-modal-title',
      text: '🛡️ Raio-X & Auditoria da Match'
    } ) );

  const $statsSummary = $( '<div />', {
    id: 'gcbooster_match_summary_badges',
    class: 'gcbooster-match-summary-badges'
  } );

  const $tabsWrap = $( '<div />', { class: 'gcbooster-match-modal-tabs' } );

  let team1Label = '';
  let team2Label = '';
  if ( isMyTeamA ) {
    team1Label = ' (Seu Time)';
    team2Label = ' - Adversários';
  } else if ( isMyTeamB ) {
    team1Label = ' - Adversários';
    team2Label = ' (Seu Time)';
  }

  const $tabAll = $( '<button />', {
    class: `gcbooster-match-tab-btn ${initialTeam === 'all' ? 'active' : ''}`,
    text: `Todos (${domPlayers.all.length || 10})`,
    'data-team': 'all'
  } );

  const $tabTeamA = $( '<button />', {
    class: `gcbooster-match-tab-btn ${initialTeam === 'teamA' ? 'active' : ''}`,
    text: `Time 1${team1Label} (${domPlayers.teamA.length || 5})`,
    'data-team': 'teamA'
  } );

  const $tabTeamB = $( '<button />', {
    class: `gcbooster-match-tab-btn ${initialTeam === 'teamB' ? 'active' : ''}`,
    text: `Time 2${team2Label} (${domPlayers.teamB.length || 5})`,
    'data-team': 'teamB'
  } );

  $tabsWrap.append( $tabAll, $tabTeamA, $tabTeamB );

  const $closeBtn = $( '<button />', {
    class: 'gcbooster-match-modal-close',
    text: '✕',
    title: 'Fechar (Esc)'
  } );

  $closeBtn.on( 'click', e => {
    e.preventDefault();
    closeMatchModal();
  } );

  $header.append( $titleWrap, $statsSummary, $tabsWrap, $closeBtn );
  $modal.append( $header );

  const $body = $( '<div />', {
    class: 'gcbooster-match-modal-body'
  } );

  const $spinnerWrap = $( '<div />', {
    class: 'gcbooster-match-modal-loading'
  } ).append( $( '<div />', { class: 'gcbooster-spinner' } ) )
    .append( $( '<span />', { text: 'Carregando auditoria e estatísticas dos jogadores...' } ) );

  $body.append( $spinnerWrap );
  $modal.append( $body );
  $overlay.append( $modal );
  $( 'body' ).append( $overlay );

  // Fechar no clique fora
  $overlay.on( 'click', e => {
    if ( $( e.target ).is( '#gcbooster_match_raiox_modal' ) ) {
      closeMatchModal();
    }
  } );

  // Fechar com ESC
  $( document ).on( 'keydown.gcbooster_match_modal', e => {
    if ( e.key === 'Escape' ) {
      closeMatchModal();
    }
  } );

  // Buscar dados dos jogadores
  const { teamA, teamB, all } = await getAllMatchPlayers();

  if ( all.length === 0 ) {
    $spinnerWrap.html( '<span style="color:#ffa500;">Nenhum jogador encontrado na match. Verifique se a sala foi carregada.</span>' );
    return;
  }

  // Verifica configuração de links de perfil
  const syncConfig = await new Promise( resolve => {
    if ( !isExtensionContextValid() ) {
      return resolve( { playerLinksEnabled: true } );
    }
    let timedOut = false;
    const timer = setTimeout( () => {
      timedOut = true;
      resolve( { playerLinksEnabled: true } );
    }, 600 );
    try {
      chrome.storage.sync.get( [ 'playerLinksEnabled' ], res => {
        if ( !timedOut ) {
          clearTimeout( timer );
          resolve( res );
        }
      } );
    } catch ( _e ) {
      if ( !timedOut ) {
        clearTimeout( timer );
        resolve( { playerLinksEnabled: true } );
      }
    }
  } );
  const linksEnabled = syncConfig?.playerLinksEnabled !== false;

  // Busca dados do jogador e links de perfil em lote
  const [ playerInfoList, linksList ] = await Promise.all( [
    Promise.all( all.map( pId => getPlayerInfo( pId ).catch( () => ( {
      dataCriacao: '-',
      totalPartidas: 0,
      porcentagemVitoria: '0.00',
      anotacao: 'Nenhuma'
    } ) ) ) ),
    linksEnabled ? getPlayerLinks( all ).catch( () => [] ) : Promise.resolve( [] )
  ] );

  if ( !document.getElementById( 'gcbooster_match_raiox_modal' ) ) {
    return;
  }

  const playerInfoMap = new Map();
  const linksMap = new Map();

  all.forEach( ( pId, idx ) => {
    playerInfoMap.set( String( pId ), playerInfoList[idx] );
  } );

  if ( Array.isArray( linksList ) ) {
    linksList.forEach( links => {
      if ( links?.gcId ) {
        linksMap.set( String( links.gcId ), links );
      }
    } );
  }

  // Calcular estatísticas agregadas do resumo
  let totalKdr = 0;
  let kdrCount = 0;

  all.forEach( pId => {
    const pInfo = playerInfoMap.get( String( pId ) );

    const kdrStat = pInfo?.stats?.find( s => s.stat === 'KDR' );
    const kdrVal = parseFloat( kdrStat?.value ?? pInfo?.kdr );
    if ( !isNaN( kdrVal ) && kdrVal > 0 ) {
      totalKdr += kdrVal;
      kdrCount++;
    }
  } );

  $statsSummary.empty();
  if ( kdrCount > 0 ) {
    const avgKdr = ( totalKdr / kdrCount ).toFixed( 2 );
    $statsSummary.append( $( '<span />', {
      class: 'gcbooster-summary-chip chip-kdr',
      text: `🎯 KDR Médio: ${avgKdr}`
    } ) );
  }

  // Renderizar times
  const renderTeams = selectedTeam => {
    $body.empty();

    const renderTeamSection = ( teamName, playerIds, teamClass ) => {
      const $section = $( '<div />', {
        class: `gcbooster-match-team-section ${teamClass}`
      } );

      const $teamHeader = $( '<div />', {
        class: 'gcbooster-match-team-header'
      } ).append( $( '<span />', { class: 'gcbooster-match-team-title', text: teamName } ) )
        .append( $( '<span />', { class: 'gcbooster-match-team-count', text: `${playerIds.length} jogadores` } ) );

      const $grid = $( '<div />', {
        class: 'gcbooster-match-players-grid'
      } );

      playerIds.forEach( pId => {
        const info = playerInfoMap.get( String( pId ) );
        const links = linksMap.get( String( pId ) );
        const $playerCard = createDivPlayers( info, links, pId );
        $grid.append( $playerCard );
      } );

      $section.append( $teamHeader, $grid );
      return $section;
    };

    if ( selectedTeam === 'all' || selectedTeam === 'teamA' ) {
      let labelA = '';
      if ( isMyTeamA ) {
        labelA = ' (SEU TIME)';
      } else if ( isMyTeamB ) {
        labelA = ' (ADVERSÁRIOS)';
      }
      const titleA = `⚔️ TIME 1${labelA}`;
      $body.append( renderTeamSection( titleA, teamA.length ? teamA : all.slice( 0, 5 ), 'team-a' ) );
    }

    if ( selectedTeam === 'all' || selectedTeam === 'teamB' ) {
      let labelB = '';
      if ( isMyTeamB ) {
        labelB = ' (SEU TIME)';
      } else if ( isMyTeamA ) {
        labelB = ' (ADVERSÁRIOS)';
      }
      const titleB = `⚔️ TIME 2${labelB}`;
      $body.append( renderTeamSection( titleB, teamB.length ? teamB : all.slice( 5 ), 'team-b' ) );
    }
  };

  renderTeams( initialTeam );

  // Ações das abas
  $tabsWrap.find( '.gcbooster-match-tab-btn' ).on( 'click', function () {
    $tabsWrap.find( '.gcbooster-match-tab-btn' ).removeClass( 'active' );
    $( this ).addClass( 'active' );
    const t = $( this ).attr( 'data-team' );
    renderTeams( t );
  } );
};

export const injectMatchButtons = () => {
  if ( !isExtensionContextValid() ) {
    return;
  }

  if ( !isMatchPage() ) {
    $( '#gcbooster_match_raiox_btn' ).remove();
    return;
  }

  if ( $( '#gcbooster_match_raiox_btn' ).length > 0 ) {
    return;
  }

  const $btn = $( '<button />', {
    id: 'gcbooster_match_raiox_btn',
    type: 'button',
    class: 'gcbooster-match-raiox-btn draw-orange',
    title: 'Visualizar Estatísticas e Raio-X de ambos os times',
    html: '<span class="gcbooster-btn-icon">🛡️</span> <span class="gcbooster-btn-text">Raio-X</span>'
  } );

  $btn.on( 'click', e => {
    e.preventDefault();
    e.stopPropagation();
    openMatchRaioXModal( { initialTeam: 'all' } );
  } );

  $( 'body' ).append( $btn );
};

export const iniciarMatchRaioX = () => {
  injectMatchButtons();

  const observer = new MutationObserver( () => {
    if ( !isExtensionContextValid() ) {
      observer.disconnect();
      return;
    }
    if ( isMatchPage() ) {
      injectMatchButtons();
    }
  } );

  observer.observe( document.body, { childList: true, subtree: true } );

  // Intervalo rápido de garantia para carregamentos dinâmicos do React
  const interval = setInterval( () => {
    if ( !isExtensionContextValid() ) {
      clearInterval( interval );
      return;
    }
    if ( isMatchPage() ) {
      injectMatchButtons();
    }
  }, 1000 );

  setTimeout( () => {
    clearInterval( interval );
    const slowInterval = setInterval( () => {
      if ( !isExtensionContextValid() ) {
        clearInterval( slowInterval );
        return;
      }
      if ( isMatchPage() ) {
        injectMatchButtons();
      }
    }, 3000 );
  }, 15000 );
};
