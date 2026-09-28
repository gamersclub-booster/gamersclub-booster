import axios from 'axios';
import { getPlayerInfo } from './getPlayerInfo';
import { auditPlayers } from '../../lib/playerAudit';
import { createDivPlayers } from './infoLobby';
import { GC_URL } from '../../lib/constants';
import { isExtensionContextValid } from '../../utils';

export const isMatchPage = () => {
  const path = window.location.pathname.toLowerCase();
  return path.includes( '/match' ) ||
         path.includes( '/partida' ) ||
         $( '.PlayerListCard' ).length > 0 ||
         $( '[id^="trigger-"]' ).length > 0;
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
  const { initialTeam = 'all', highlightPlayer = null } = options;

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

  const $tabAll = $( '<button />', {
    class: `gcbooster-match-tab-btn ${initialTeam === 'all' ? 'active' : ''}`,
    text: 'Todos (10)',
    'data-team': 'all'
  } );

  const $tabTeamA = $( '<button />', {
    class: `gcbooster-match-tab-btn ${initialTeam === 'teamA' ? 'active' : ''}`,
    text: 'Time 1 (5)',
    'data-team': 'teamA'
  } );

  const $tabTeamB = $( '<button />', {
    class: `gcbooster-match-tab-btn ${initialTeam === 'teamB' ? 'active' : ''}`,
    text: 'Time 2 - Adversários (5)',
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

  // Verifica configuração de player audit
  const syncConfig = await new Promise( resolve => {
    if ( !isExtensionContextValid() ) {
      return resolve( { playerAuditEnabled: true } );
    }
    let timedOut = false;
    const timer = setTimeout( () => {
      timedOut = true;
      resolve( { playerAuditEnabled: true } );
    }, 600 );
    try {
      chrome.storage.sync.get( [ 'playerAuditEnabled' ], res => {
        if ( !timedOut ) {
          clearTimeout( timer );
          resolve( res );
        }
      } );
    } catch ( _e ) {
      if ( !timedOut ) {
        clearTimeout( timer );
        resolve( { playerAuditEnabled: true } );
      }
    }
  } );
  const auditEnabled = syncConfig?.playerAuditEnabled !== false;

  // Busca dados e auditoria em lote
  const [ playerInfoList, auditList ] = await Promise.all( [
    Promise.all( all.map( pId => getPlayerInfo( pId ).catch( () => ( {
      dataCriacao: '-',
      totalPartidas: 0,
      porcentagemVitoria: '0.00',
      anotacao: 'Nenhuma'
    } ) ) ) ),
    auditEnabled ? auditPlayers( all ).catch( () => [] ) : Promise.resolve( [] )
  ] );

  if ( !document.getElementById( 'gcbooster_match_raiox_modal' ) ) {
    return;
  }

  const playerInfoMap = new Map();
  const auditMap = new Map();

  all.forEach( ( pId, idx ) => {
    playerInfoMap.set( String( pId ), playerInfoList[idx] );
  } );

  if ( Array.isArray( auditList ) ) {
    auditList.forEach( audit => {
      if ( audit?.gcId ) {
        auditMap.set( String( audit.gcId ), audit );
      }
    } );
  }

  // Calcular estatísticas agregadas do resumo
  let bannedCount = 0;
  let suspectCount = 0;
  let cleanCount = 0;
  let totalKdr = 0;
  let kdrCount = 0;

  all.forEach( pId => {
    const audit = auditMap.get( String( pId ) );
    const pInfo = playerInfoMap.get( String( pId ) );

    if ( audit?.vacBanned || audit?.numberOfGameBans > 0 ) {
      bannedCount++;
    } else if ( audit?.riskLevel === 'suspect' ) {
      suspectCount++;
    } else if ( audit ) {
      cleanCount++;
    }

    const kdrStat = pInfo?.stats?.find( s => s.stat === 'KDR' );
    const kdrVal = parseFloat( kdrStat?.value ?? pInfo?.kdr );
    if ( !isNaN( kdrVal ) && kdrVal > 0 ) {
      totalKdr += kdrVal;
      kdrCount++;
    }
  } );

  $statsSummary.empty();
  if ( bannedCount > 0 ) {
    $statsSummary.append( $( '<span />', {
      class: 'gcbooster-summary-chip chip-ban',
      text: `⛔ ${bannedCount} BAN`
    } ) );
  }
  if ( suspectCount > 0 ) {
    $statsSummary.append( $( '<span />', {
      class: 'gcbooster-summary-chip chip-suspect',
      text: `⚠️ ${suspectCount} Suspeito(s)`
    } ) );
  }
  if ( cleanCount > 0 ) {
    $statsSummary.append( $( '<span />', {
      class: 'gcbooster-summary-chip chip-clean',
      text: `🟢 ${cleanCount} Limpos`
    } ) );
  }
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
        const audit = auditMap.get( String( pId ) );
        const $playerCard = createDivPlayers( info, audit, pId );

        if ( highlightPlayer && String( highlightPlayer ) === String( pId ) ) {
          $playerCard.addClass( 'gcbooster-player-highlight' );
        }

        $grid.append( $playerCard );
      } );

      $section.append( $teamHeader, $grid );
      return $section;
    };

    if ( selectedTeam === 'all' || selectedTeam === 'teamA' ) {
      const titleA = '⚔️ TIME 1 (SEU TIME)';
      $body.append( renderTeamSection( titleA, teamA.length ? teamA : all.slice( 0, 5 ), 'team-a' ) );
    }

    if ( selectedTeam === 'all' || selectedTeam === 'teamB' ) {
      const titleB = '⚔️ TIME 2 (ADVERSÁRIOS)';
      $body.append( renderTeamSection( titleB, teamB.length ? teamB : all.slice( 5 ), 'team-b' ) );
    }

    if ( highlightPlayer ) {
      const $highlighted = $body.find( '.gcbooster-player-highlight' );
      if ( $highlighted.length ) {
        setTimeout( () => {
          $highlighted[0]?.scrollIntoView( { behavior: 'smooth', block: 'nearest' } );
        }, 150 );
      }
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
  if ( !isExtensionContextValid() || !isMatchPage() ) {
    return;
  }

  // Remove botões redundantes que possam ter ficado no DOM
  $( '#gcbooster_match_raiox_btn, #gcbooster_team_a_raiox_btn, #gcbooster_team_b_raiox_btn' ).remove();

  // Badges de Raio-X individual nos cards de jogador (.PlayerListCard)
  $( '.PlayerListCard' ).each( ( _, card ) => {
    const $card = $( card );
    if ( $card.find( '.gcbooster-match-player-badge' ).length > 0 ) {
      return;
    }

    const $badges = $card.find( '.PlayerIdentityBadges' );
    if ( $badges.length === 0 ) {
      return;
    }

    // Identificar playerId
    let playerId = null;
    const $trigger = $card.find( '[id^="trigger-"]' );
    if ( $trigger.length > 0 ) {
      const match = $trigger.attr( 'id' ).replace( 'trigger-', '' );
      if ( /^\d+$/.test( match ) ) {
        playerId = match;
      }
    }
    if ( !playerId ) {
      const href = $card.find( 'a[href*="/jogador/"], a[href*="/player/"]' ).attr( 'href' ) || '';
      const match = href.match( /\/(?:jogador|player)\/(\d+)/i );
      if ( match && match[1] ) {
        playerId = match[1];
      }
    }

    if ( !playerId ) {
      return;
    }

    const $badge = $( '<div />', {
      class: 'WasdTooltip__wrapper gcbooster-match-player-badge',
      title: '[GC Booster]: Ver Raio-X deste jogador',
      text: '🛡️'
    } );

    $badge.on( 'click', e => {
      e.preventDefault();
      e.stopPropagation();
      openMatchRaioXModal( {
        initialTeam: $card.hasClass( 'PlayerListCard--left' ) ? 'teamA' : 'teamB',
        highlightPlayer: playerId
      } );
    } );

    $badges.append( $badge );
  } );
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
