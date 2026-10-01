import { getPlayerInfo } from './getPlayerInfo';
import { auditPlayers } from '../../lib/playerAudit';
import { GC_URL } from '../../lib/constants';
import { isExtensionContextValid } from '../../utils';

const IMAGE_ALT = '[GC Booster]: Buscar informações da lobby';

const createDiv = lobbyId => $( '<div/>',
  {
    id: `gcbooster_lupa_${lobbyId}`,
    class: 'gcbooster_lupa draw-orange',
    title: IMAGE_ALT
  } );

const createProfileLink = ( playerId, audit ) => {
  const gcHost = GC_URL || window.location.hostname || 'gamersclub.com.br';
  const gcUrl = `https://${gcHost}/jogador/${playerId}`;
  const displayName = audit?.personaName ? audit.personaName : 'Jogador';

  return $( '<div />', {
    class: 'gcbooster-info-profile'
  } ).append( $( '<a />', {
    class: 'gcbooster-profile-redirect-link',
    href: gcUrl,
    target: '_blank',
    rel: 'noopener noreferrer',
    title: `Abrir perfil de ${displayName} na Gamers Club`,
    text: '👤 Perfil'
  } ) );
};

const createDivVitory = playerInfo => $( '<div />',
  {
    class: 'gcbooster-info-stat',
    title: 'Porcentagem de vitória',
    'data-tip-text': 'Porcentagem de vitória',
    text: `%: ${!isNaN( playerInfo?.porcentagemVitoria ) ? Math.round( playerInfo.porcentagemVitoria ) : 0}%`
  } );

const createDivDateCreate = playerInfo => $( '<div />',
  {
    class: 'gcbooster-info-stat',
    title: 'Tempo de conta',
    'data-tip-text': 'Tempo de conta',
    text: `T: ${calcAge( playerInfo?.dataCriacao )}`
  } );

const createDivLobbys = playerInfo => $( '<div />',
  {
    class: 'gcbooster-info-stat',
    title: 'Partidas jogadas',
    'data-tip-text': 'Partidas jogadas',
    text: `P: ${playerInfo?.totalPartidas ?? 0}`
  } );

const createClose = ( lobbyId, isOverlay = false ) => {
  const $closeBtn = $( '<div />', {
    class: 'gcbooster-info-close draw-orange',
    title: 'Fechar',
    'data-tip-text': 'Fechar',
    text: '✕'
  } );
  $closeBtn.on( 'click', e => {
    e.preventDefault();
    e.stopPropagation();
    if ( isOverlay ) {
      $( `#gcbooster_challenge_overlay_${lobbyId}` ).remove();
    } else {
      $( `#infos_lobby_${lobbyId}` ).empty().remove();
    }
  } );
  return $closeBtn;
};

const createDivAnotacao = playerInfo => $( '<div />',
  {
    class: 'gcbooster-info-stat',
    title: 'Anotação',
    'data-tip-text': 'Anotação',
    // eslint-disable-next-line no-nested-ternary
    text: `A: ${playerInfo?.anotacao === 'Positiva' ? '👍' : playerInfo?.anotacao === 'Negativa' ? '👎' : '-'}`
  } );

const createDivAudit = audit => {
  if ( !audit || audit.error ) { return ''; }

  const $auditDiv = $( '<div />', {
    class: 'gcbooster-info-audit'
  } );

  let statusText = 'Steam: OK';
  let statusColor = '#2ecc71';

  if ( audit.vacBanned || audit.numberOfGameBans > 0 ) {
    statusText = '⛔ BAN';
    statusColor = '#e74c3c';
  } else if ( audit.riskLevel === 'suspect' ) {
    statusText = '⚠️ Suspeito';
    statusColor = '#f39c12';
  }

  $auditDiv.append( $( '<div />', {
    class: 'gcbooster-audit-status',
    text: statusText,
    style: `color: ${statusColor};`
  } ) );

  if ( audit.steamLevel !== null && audit.steamLevel !== undefined ) {
    $auditDiv.append( $( '<div />', {
      class: 'gcbooster-audit-level',
      text: `Lvl ${audit.steamLevel}`
    } ) );
  }

  const $actionsRow = $( '<div />', {
    class: 'gcbooster-audit-actions-row'
  } );

  if ( audit.steamUrl ) {
    $actionsRow.append( $( '<a />', {
      class: 'gcbooster-steam-btn',
      href: audit.steamUrl,
      target: '_blank',
      rel: 'noopener noreferrer',
      text: '🎮 Steam',
      title: 'Abrir perfil na Steam'
    } ) );
  }

  if ( audit.csrepUrl ) {
    $actionsRow.append( $( '<a />', {
      class: 'gcbooster-csrep-btn',
      href: audit.csrepUrl,
      target: '_blank',
      rel: 'noopener noreferrer',
      text: '🔍 csREP',
      title: 'Abrir auditoria completa no csREP.gg'
    } ) );
  }

  $auditDiv.append( $actionsRow );

  return $auditDiv;
};

const createDivKdr = playerInfo => {
  const kdrStat = playerInfo?.stats?.find( stat => stat.stat === 'KDR' );
  const kdr = kdrStat?.value ?? playerInfo?.kdr ?? null;
  if ( kdr === null || kdr === undefined ) {
    return $( '<div />', {
      class: 'gcbooster-info-stat',
      title: 'KDR Médio',
      'data-tip-text': 'KDR Médio',
      text: 'KDR: -'
    } );
  }
  const formatted = !isNaN( Number( kdr ) ) ? Number( kdr ).toFixed( 2 ) : kdr;
  return $( '<div />', {
    class: 'gcbooster-info-stat',
    title: 'KDR Médio',
    'data-tip-text': 'KDR Médio',
    text: `KDR: ${formatted}`
  } );
};

export const createDivPlayers = ( playerInfo, audit, playerId ) => $( '<div/>',
  {
    class: 'gcbooster-info-player',
    'data-player-card-id': playerId
  } )
  .append( createProfileLink( playerId, audit ) )
  .append( $( '<div />', { class: 'gcbooster-info-stats-group' } )
    .append( createDivKdr( playerInfo ) )
    .append( createDivDateCreate( playerInfo ) )
    .append( createDivLobbys( playerInfo ) )
    .append( createDivVitory( playerInfo ) )
    .append( createDivAnotacao( playerInfo ) )
  )
  .append( createDivAudit( audit ) );

const createImage = lobbyId => $( '<img/>', {
  id: `gcbooster_lupa_img_${lobbyId}`,
  width: '20px',
  src: 'https://i.postimg.cc/yxSCmnZc/lupa.png',
  title: IMAGE_ALT,
  'data-tip-text': IMAGE_ALT
} );

export const getPlayersIds = element => {
  const selector = [
    'a.LobbyPlayerVertical',
    '.LobbyPlayerVertical a',
    '.LobbyPlayerVertical',
    '.sala-lineup-imagem a',
    '.sala-lineup-player a',
    'a[href*="/jogador/"]',
    '[data-player-id]',
    '[data-playerid]',
    '[id^="trigger-"]',
    'img[src*="/avatar/"]',
    'img[src*="/players/"]'
  ].join( ', ' );
  const elements = element.find( selector ).toArray();
  if ( element.is( selector ) ) {
    elements.unshift( element[0] );
  }

  const ids = [];
  elements.forEach( el => {
    const $el = $( el );
    if ( $el.closest( '.infos_lobby, .gcbooster_lupa, .gcbooster-challenge-modal-overlay' ).length > 0 ) {
      return;
    }
    if ( $el.find( '.PlayerPlaceholder' ).length > 0 || $el.hasClass( 'PlayerPlaceholder' ) ) {
      return;
    }

    // 1. Prioridade 1: Link direto com /jogador/{id} ou /player/{id}
    const href = el.href || $el.attr( 'href' ) || $el.find( 'a' ).attr( 'href' ) || '';
    const matchHref = href.match( /\/(?:jogador|player)\/(\d+)/i );
    if ( matchHref && matchHref[1] && matchHref[1] !== '0' ) {
      ids.push( matchHref[1] );
      return;
    }

    // 2. Prioridade 2: Atributos específicos de jogador
    const dataPlayerId = $el.attr( 'data-player-id' ) || $el.attr( 'data-playerid' );
    if ( dataPlayerId && /^\d+$/.test( dataPlayerId ) && dataPlayerId !== '0' ) {
      ids.push( dataPlayerId );
      return;
    }

    // 3. Trigger de tooltip/popover de jogador (trigger-{id})
    const elId = $el.attr( 'id' ) || '';
    if ( elId.startsWith( 'trigger-' ) ) {
      const pId = elId.replace( 'trigger-', '' );
      if ( /^\d+$/.test( pId ) && pId !== '0' ) {
        ids.push( pId );
        return;
      }
    }

    // 4. Imagem de avatar com ID de jogador (mínimo 3 dígitos para não pegar badges 0.svg, 1.svg)
    const src = $el.attr( 'src' ) || $el.find( 'img' ).attr( 'src' ) || '';
    const matchSrc = src.match( /\/(?:players\/)?avatar\/(\d{3,})/i ) || src.match( /\/(?:players|jogador|player)\/(\d{3,})/i );
    if ( matchSrc && matchSrc[1] && matchSrc[1] !== '0' ) {
      ids.push( matchSrc[1] );
      return;
    }

    // 5. Se o href terminar com ID numérico e tiver relação com jogador
    if ( href && ( href.includes( 'jogador' ) || href.includes( 'player' ) || href.includes( 'user' ) ) ) {
      const parts = href.split( '/' ).filter( Boolean );
      const last = parts.pop();
      if ( last && /^\d+$/.test( last ) && last !== '0' ) {
        ids.push( last );
      }
    }
  } );

  return Array.from( new Set( ids.filter( id => id && id !== '0' ) ) );
};

const getPlayersIdsNew = getPlayersIds;

export const createModal = ( lobbyId, type ) => {
  const $modal = $( '<div />', {
    id: `infos_lobby_${lobbyId}`,
    class: `infos_lobby ${type === 'challenge' ? 'infos_lobby--challenge' : 'infos_lobby--room'}`,
    title: 'Estatísticas'
  } );

  const $header = $( '<div />', {
    class: 'gcbooster-modal-header',
    html: '<span>🛡️ Estatísticas & Raio-X</span>'
  } );

  $modal.append( $header );
  return $modal;
};

export const calcAge = ageDate => {
  if ( !ageDate || typeof ageDate !== 'string' ) { return '-'; }
  const parts = ageDate.split( /[/: ]/ ).map( v => parseInt( v, 10 ) );
  if ( parts.length < 3 || isNaN( parts[0] ) ) { return '-'; }

  const [ dia, mes, ano ] = parts;
  const dataFormated = new Date( ano, mes - 1, dia );
  const dateNow = new Date();

  const diff = Math.floor( dateNow.getTime() - dataFormated.getTime() );
  const day = 1000 * 60 * 60 * 24;

  const days = Math.floor( diff / day );
  const months = Math.floor( days / 31 );
  const years = Math.floor( months / 12 );

  const finalMonths = months - ( years * 12 );

  if ( years > 0 ) {
    return `+${years}a`;
  }

  if ( finalMonths > 0 ) {
    return `${finalMonths}m`;
  }

  return 'Nova';
};

const toggleRaioXModal = async ( $trigger, $container, getPlayersIdsFunction, type, lobbyId ) => {
  // Para desafios: usa overlay fixo na tela (evita ficar escondido pela sidebar)
  const isChallenge = type === 'challenge';
  const overlayId = `gcbooster_challenge_overlay_${lobbyId}`;

  // Toggle: se já existe overlay/modal, fecha e sai
  if ( isChallenge ) {
    if ( $( `#${overlayId}` ).length > 0 ) {
      $( `#${overlayId}` ).remove();
      return;
    }
  } else {
    const $existingModal = $( `#infos_lobby_${lobbyId}` );
    if ( $existingModal.length > 0 ) {
      $existingModal.empty().remove();
      return;
    }
  }

  $trigger.css( 'opacity', '0.6' );

  try {
    let players = getPlayersIdsFunction( $container );

    // Se a sala ainda estiver montando os elementos no DOM, aguarda brevemente e tenta novamente
    if ( players.length === 0 ) {
      await new Promise( resolve => setTimeout( resolve, 120 ) );
      players = getPlayersIdsFunction( $container );
    }

    const modal = createModal( lobbyId, type );

    if ( isChallenge ) {
      // Cria overlay de tela cheia (igual ao modal de partida)
      const $overlay = $( '<div />', {
        id: overlayId,
        class: 'gcbooster-challenge-modal-overlay'
      } );

      const $modalWrap = $( '<div />', {
        class: 'gcbooster-challenge-modal-wrap'
      } );

      modal.append( createClose( lobbyId, true ) );
      $modalWrap.append( modal );
      $overlay.append( $modalWrap );

      // Clique no fundo escurecido fecha o modal
      $overlay.on( 'click', e => {
        if ( $( e.target ).is( $overlay ) ) {
          $overlay.remove();
        }
      } );

      // ESC fecha o modal
      $( document ).off( `keydown.gcbooster_challenge_${lobbyId}` ).on( `keydown.gcbooster_challenge_${lobbyId}`, e => {
        if ( e.key === 'Escape' ) {
          $overlay.remove();
          $( document ).off( `keydown.gcbooster_challenge_${lobbyId}` );
        }
      } );

      $( 'body' ).append( $overlay );
    } else {
      modal.append( createClose( lobbyId, false ) );
      $container.append( modal );
    }

    if ( players.length === 0 ) {
      modal.append( $( '<div />', {
        class: 'gcbooster-info-stat',
        style: 'grid-column: 1 / -1; padding: 10px; color: #ffa500;',
        text: 'Nenhum jogador encontrado na sala.'
      } ) );
      return;
    }

    // Cria spinners isolados para esse lobby
    players.forEach( playerId => {
      const loadingDiv = $( '<div/>', {
        id: `loading-${lobbyId}-${playerId}`,
        'data-player-id': playerId,
        class: 'gcbooster-info-player-loading'
      } ).append( $( '<div/>', {
        class: 'gcbooster-spinner'
      } ) );
      modal.append( loadingDiv );
    } );

    // Verifica configuração de audit com timeout de segurança
    const syncConfig = await new Promise( resolve => {
      if ( !isExtensionContextValid() ) {
        return resolve( { playerAuditEnabled: true } );
      }
      let timedOut = false;
      const timer = setTimeout( () => {
        timedOut = true;
        resolve( { playerAuditEnabled: true } );
      }, 500 );
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

    // Renderização progressiva em streaming para zero espera
    const playerStatsMap = new Map();
    const playerAuditMap = new Map();

    const updateCard = pId => {
      if ( !document.getElementById( `infos_lobby_${lobbyId}` ) ) { return; }
      const info = playerStatsMap.get( String( pId ) );
      if ( !info ) { return; }

      const audit = playerAuditMap.get( String( pId ) ) || null;
      const $slot = modal.find( `[data-player-id="${pId}"], [data-player-card-id="${pId}"]` );
      if ( $slot.length > 0 ) {
        const $card = createDivPlayers( info, audit, pId );
        $slot.replaceWith( $card );
      }
    };

    // 1. Auditoria Steam / csREP iniciada em paralelo
    const auditPromise = auditEnabled ?
      auditPlayers( players ).then( list => {
        if ( Array.isArray( list ) ) {
          list.forEach( a => {
            if ( a?.gcId ) { playerAuditMap.set( String( a.gcId ), a ); }
          } );
        }
        players.forEach( pId => updateCard( pId ) );
      } ).catch( () => {} ) : Promise.resolve();

    // 2. Busca stats de cada jogador individualmente com atualização imediata (progressive render)
    const infoPromises = players.map( pId =>
      getPlayerInfo( pId )
        .then( info => {
          playerStatsMap.set( String( pId ), info );
          updateCard( pId );
        } )
        .catch( () => {
          playerStatsMap.set( String( pId ), {
            dataCriacao: '-',
            totalPartidas: 0,
            porcentagemVitoria: '0.00',
            anotacao: 'Nenhuma'
          } );
          updateCard( pId );
        } )
    );

    // Aguarda todos finalizarem antes de restaurar a opacidade do botão
    await Promise.allSettled( [ ...infoPromises, auditPromise ] );
  } finally {
    $trigger.css( 'opacity', '1' );
  }
};

const injectChallengeRaioXButton = ( $card, _players, lobbyId ) => {
  if ( $card.find( `#gcbooster_btn_challenge_${lobbyId}` ).length > 0 || $card.find( '.gcbooster_lupa' ).length > 0 ) {
    return;
  }

  // Tenta encontrar a área de ações da proposta / card (ex: sidebar com ações)
  const actionsSelector = [
    '.sidebar-sala-action-buttons',
    '.sidebar-desafios-play'
  ].join( ', ' );
  const $actions = $card.find( actionsSelector ).first();

  if ( $actions.length === 0 ) {
    return;
  }

  const $btn = $( '<button />', {
    id: `gcbooster_btn_challenge_${lobbyId}`,
    type: 'button',
    class: 'gcbooster-challenge-raiox-btn draw-orange',
    title: 'Visualizar Estatísticas e Raio-X da equipe',
    html: '<span class="gcbooster-btn-icon">🛡️</span> <span class="gcbooster-btn-text">Raio-X</span>'
  } );

  $btn.on( 'click', e => {
    e.preventDefault();
    e.stopPropagation();
    toggleRaioXModal( $btn, $card, getPlayersIds, 'challenge', lobbyId );
  } );

  $actions.prepend( $btn );
};

const createModalForElementNew = ( element, getPlayersIdsFunction, type, lobbyId ) => {
  if ( element.find( '.gcbooster_lupa' ).length === 0 ) {
    const div = createDiv( lobbyId );
    const image = createImage( lobbyId );

    div.append( image );

    let isLoading = false;

    div.on( 'click', async e => {
      e.preventDefault();
      e.stopPropagation();

      if ( isLoading ) { return; }
      isLoading = true;
      try {
        await toggleRaioXModal( div, element, getPlayersIdsFunction, type, lobbyId );
      } finally {
        isLoading = false;
      }
    } );

    element.append( div );
  }
};

export const scanAndInjectLupa = () => {
  // 1. Salas de desafio (inclui aba "Desafios" e aba "Meus desafios")
  const challengeSelectors = [
    '.LobbyChallengeLineUpCard',
    '.LobbyChallengeCard',
    '.LobbyChallengeCard__item',
    '.ChallengesList__item',
    '[class*="ChallengeLineUp"]',
    '[class*="challengeLineUp"]',
    '[class*="ChallengeCard"]',
    '[class*="challengeCard"]',
    '[class*="ProposalCard"]',
    '[class*="proposalCard"]',
    '[class*="ProposalItem"]',
    '[class*="proposalItem"]',
    '[class*="ChallengeItem"]',
    '[class*="challengeItem"]',
    '[class*="MyChallenges"]',
    '[class*="my-challenges"]',
    '[class*="MyChallenge"]',
    '[class*="my-challenge"]',
    '.sidebar-desafios-salas .sidebar-item',
    '.sidebar-desafios-team'
  ].join( ', ' );

  // Processa cards conhecidos de desafios
  $( challengeSelectors ).each( ( _, element ) => {
    const $element = $( element );

    // Se o elemento contém um filho que também é selecionado, priorize o filho
    if ( $element.find( '.LobbyChallengeLineUpCard, [class*="ChallengeLineUp"]' ).length > 0 &&
         !$element.hasClass( 'LobbyChallengeLineUpCard' ) &&
         !$element.is( '[class*="ChallengeLineUp"]' ) ) {
      return;
    }

    const players = getPlayersIds( $element );
    if ( players.length === 0 ) {
      return;
    }

    let lobbyId = $element.attr( 'data-challenge-id' ) || $element.attr( 'data-id' ) || $element.attr( 'id' );
    if ( !lobbyId || !/^[a-zA-Z0-9_-]+$/.test( lobbyId ) ) {
      lobbyId = `challenge_${players.slice( 0, 3 ).join( '_' )}`;
    }

    // Garante o gatilho da lupa no card de desafio
    if ( $element.find( '.gcbooster_lupa' ).length === 0 ) {
      createModalForElementNew( $element, getPlayersIds, 'challenge', lobbyId );
    }

    // Injeta o botão apenas se for proposta em sidebar com área de ações específica
    injectChallengeRaioXButton( $element, players, lobbyId );
  } );

  // 2. Busca abrangente por propostas/lineups na aba de Desafios caso as classes variem
  const challengeContainers = [
    '#challengeList',
    '.sidebar-desafios',
    '.ChallengesList',
    '[class*="Challenges" i]',
    '[class*="challenges" i]',
    '[class*="Desafios" i]',
    '[class*="desafios" i]'
  ].join( ', ' );

  $( challengeContainers ).find( 'div, section, li' ).each( ( _, el ) => {
    const $el = $( el );
    if ( $el.find( '.gcbooster-challenge-raiox-btn, .gcbooster_lupa' ).length > 0 ) {
      return;
    }

    const players = getPlayersIds( $el );
    // Se possui exatamente entre 2 e 5 jogadores e não possui filhos com os mesmos jogadores
    if ( players.length >= 2 && players.length <= 5 ) {
      const hasChildLineup = $el.children().toArray().some( child => getPlayersIds( $( child ) ).length >= 2 );
      if ( !hasChildLineup ) {
        const lobbyId = `challenge_${players.slice( 0, 3 ).join( '_' )}`;
        createModalForElementNew( $el, getPlayersIds, 'challenge', lobbyId );
        injectChallengeRaioXButton( $el, players, lobbyId );
      }
    }
  } );

  // 3. Salas normais / lobby
  const roomSelectors = [
    '[id^="roomCardWrapper-"]',
    '[id^="room-card-"]',
    '[id^="lobby-card-"]',
    '[class*="RoomCard"]:not([class*="RoomCardWrapper"] [class*="RoomCard"])',
    '[class*="roomCard"]:not([class*="roomCardWrapper"] [class*="roomCard"])',
    '[class*="LobbyCard"]:not([class*="LobbyCard"] [class*="LobbyCard"])',
    '[class*="lobbyCard"]:not([class*="lobbyCard"] [class*="lobbyCard"])'
  ].join( ', ' );

  $( roomSelectors ).each( ( _, element ) => {
    const $element = $( element );
    const lobbyId = $element.attr( 'id' ) ||
      `room_${$element.attr( 'data-id' ) || $element.attr( 'data-room-id' ) || $element.index()}`;
    createModalForElementNew( $element, getPlayersIdsNew, 'lobby', lobbyId );
  } );
};

export const iniciarLupa = () => {
  // Executa imediatamente para salas já carregadas
  scanAndInjectLupa();

  // Observer com detecção rápida para novas salas inseridas
  const observer = new MutationObserver( () => {
    if ( !isExtensionContextValid() ) {
      observer.disconnect();
      return;
    }
    scanAndInjectLupa();
  } );
  observer.observe( document.body, { childList: true, subtree: true } );

  // Listener de clique para abas de desafios (ex: "Meus desafios", "Desafios")
  $( document ).on( 'click', 'button, [role="tab"], a, div', function () {
    const text = $( this ).text()?.trim()?.toLowerCase();
    if ( text && ( text.includes( 'desafio' ) || text.includes( 'challenge' ) || text.includes( 'lobby' ) ) ) {
      setTimeout( () => scanAndInjectLupa(), 50 );
      setTimeout( () => scanAndInjectLupa(), 200 );
      setTimeout( () => scanAndInjectLupa(), 600 );
      setTimeout( () => scanAndInjectLupa(), 1200 );
      setTimeout( () => scanAndInjectLupa(), 2000 );
    }
  } );

  // Intervalo de segurança rápido nos primeiros 6s para garantia de 0 delay
  const intervalFast = setInterval( () => {
    if ( !isExtensionContextValid() ) {
      clearInterval( intervalFast );
      return;
    }
    scanAndInjectLupa();
  }, 400 );
  setTimeout( () => {
    clearInterval( intervalFast );
    const intervalSlow = setInterval( () => {
      if ( !isExtensionContextValid() ) {
        clearInterval( intervalSlow );
        return;
      }
      scanAndInjectLupa();
    }, 1200 );
  }, 6000 );
};

export const infoChallenge = () => scanAndInjectLupa();
export const infoLobby = () => scanAndInjectLupa();
