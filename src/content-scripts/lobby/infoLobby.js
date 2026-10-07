import { getPlayerInfo } from './getPlayerInfo';
import { getPlayerLinks } from '../../lib/playerLinks';
import { GC_URL } from '../../lib/constants';
import { isExtensionContextValid } from '../../utils';

const IMAGE_ALT = '[GC Booster]: Buscar informações da lobby';

const createDiv = lobbyId => $( '<div/>',
  {
    id: `gcbooster_lupa_${lobbyId}`,
    class: 'gcbooster_lupa draw-orange',
    title: IMAGE_ALT
  } );

const createProfileLink = playerId => {
  const gcHost = GC_URL || window.location.hostname || 'gamersclub.com.br';
  const gcUrl = `https://${gcHost}/jogador/${playerId}`;

  return $( '<div />', {
    class: 'gcbooster-info-profile'
  } ).append( $( '<a />', {
    class: 'gcbooster-profile-redirect-link',
    href: gcUrl,
    target: '_blank',
    rel: 'noopener noreferrer',
    title: 'Abrir perfil na Gamers Club',
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

const createClose = lobbyId => {
  const $closeBtn = $( '<div />', {
    class: 'gcbooster-info-close draw-orange',
    title: 'Fechar',
    'data-tip-text': 'Fechar',
    text: '✕'
  } );
  $closeBtn.on( 'click', e => {
    e.preventDefault();
    e.stopPropagation();
    $( `#infos_lobby_${lobbyId}` ).empty().remove();
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

const createDivLinks = links => {
  if ( !links || links.error || ( !links.steamUrl && !links.csrepUrl ) ) { return ''; }

  const $linksDiv = $( '<div />', {
    class: 'gcbooster-info-audit'
  } );

  const $actionsRow = $( '<div />', {
    class: 'gcbooster-audit-actions-row'
  } );

  if ( links.steamUrl ) {
    $actionsRow.append( $( '<a />', {
      class: 'gcbooster-steam-btn',
      href: links.steamUrl,
      target: '_blank',
      rel: 'noopener noreferrer',
      text: '🎮 Steam',
      title: 'Abrir perfil na Steam'
    } ) );
  }

  if ( links.csrepUrl ) {
    $actionsRow.append( $( '<a />', {
      class: 'gcbooster-csrep-btn',
      href: links.csrepUrl,
      target: '_blank',
      rel: 'noopener noreferrer',
      text: '🔍 csREP',
      title: 'Abrir auditoria completa no csREP.gg'
    } ) );
  }

  $linksDiv.append( $actionsRow );

  return $linksDiv;
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

export const createDivPlayers = ( playerInfo, links, playerId ) => $( '<div/>',
  {
    class: 'gcbooster-info-player',
    'data-player-card-id': playerId
  } )
  .append( createProfileLink( playerId ) )
  .append( $( '<div />', { class: 'gcbooster-info-stats-group' } )
    .append( createDivKdr( playerInfo ) )
    .append( createDivDateCreate( playerInfo ) )
    .append( createDivLobbys( playerInfo ) )
    .append( createDivVitory( playerInfo ) )
    .append( createDivAnotacao( playerInfo ) )
  )
  .append( createDivLinks( links ) );

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
    if ( $el.closest( '.infos_lobby, .gcbooster_lupa' ).length > 0 ) {
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

export const createModal = lobbyId => {
  const $modal = $( '<div />', {
    id: `infos_lobby_${lobbyId}`,
    class: 'infos_lobby infos_lobby--room',
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

const toggleRaioXModal = async ( $trigger, $container, getPlayersIdsFunction, lobbyId ) => {
  const $existingModal = $( `#infos_lobby_${lobbyId}` );
  if ( $existingModal.length > 0 ) {
    $existingModal.empty().remove();
    return;
  }

  $trigger.css( 'opacity', '0.6' );

  try {
    let players = getPlayersIdsFunction( $container );

    // Se a sala ainda estiver montando os elementos no DOM, aguarda brevemente e tenta novamente
    if ( players.length === 0 ) {
      await new Promise( resolve => setTimeout( resolve, 120 ) );
      players = getPlayersIdsFunction( $container );
    }

    const modal = createModal( lobbyId );
    modal.append( createClose( lobbyId ) );
    $container.append( modal );

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

    // Renderização progressiva em streaming para zero espera
    const playerStatsMap = new Map();
    const playerLinksMap = new Map();

    const updateCard = pId => {
      if ( !document.getElementById( `infos_lobby_${lobbyId}` ) ) { return; }
      const info = playerStatsMap.get( String( pId ) );
      if ( !info ) { return; }

      const links = playerLinksMap.get( String( pId ) ) || null;
      const $slot = modal.find( `[data-player-id="${pId}"], [data-player-card-id="${pId}"]` );
      if ( $slot.length > 0 ) {
        const $card = createDivPlayers( info, links, pId );
        $slot.replaceWith( $card );
      }
    };

    // 1. Links de Steam / csREP resolvidos em paralelo
    const linksPromise = getPlayerLinks( players ).then( list => {
      if ( Array.isArray( list ) ) {
        list.forEach( l => {
          if ( l?.gcId ) { playerLinksMap.set( String( l.gcId ), l ); }
        } );
      }
      players.forEach( pId => updateCard( pId ) );
    } ).catch( () => {} );

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
    await Promise.allSettled( [ ...infoPromises, linksPromise ] );
  } finally {
    $trigger.css( 'opacity', '1' );
  }
};

const createModalForElementNew = ( element, getPlayersIdsFunction, lobbyId ) => {
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
        await toggleRaioXModal( div, element, getPlayersIdsFunction, lobbyId );
      } finally {
        isLoading = false;
      }
    } );

    element.append( div );
  }
};

export const scanAndInjectLupa = () => {
  // Salas normais / lobby
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
    createModalForElementNew( $element, getPlayersIds, lobbyId );
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

export const infoLobby = () => scanAndInjectLupa();
