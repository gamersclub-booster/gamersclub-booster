import { getPlayerInfo } from './getPlayerInfo';
import { auditPlayers } from '../../lib/playerAudit';
import { GC_URL } from '../../lib/constants';

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

const createDivPlayers = ( playerInfo, audit, playerId ) => $( '<div/>',
  {
    class: 'gcbooster-info-player'
  } )
  .append( createProfileLink( playerId, audit ) )
  .append( $( '<div />', { class: 'gcbooster-info-stats-group' } )
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

const getPlayersIds = element => element
  .find( '.LobbyPlayerVertical, .sala-lineup-imagem a' )
  .toArray()
  .map( e => {
    const href = e.getAttribute( 'href' ) || '';
    const match = href.match( /\/(?:jogador|player)\/(\d+)/i );
    if ( match ) { return match[1]; }
    return href.split( '/' ).filter( Boolean ).pop();
  } )
  .filter( Boolean );

const getPlayersIdsNew = getPlayersIds;

const createModal = ( lobbyId, type ) => {
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

const calcAge = ageDate => {
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

const createModalForElementNew = ( element, getPlayersIdsFunction, type, lobbyId ) => {
  if ( element.find( `#gcbooster_lupa_${lobbyId}` ).length === 0 ) {
    const div = createDiv( lobbyId );
    const modal = createModal( lobbyId, type );
    const image = createImage( lobbyId );

    div.append( image );

    div.on( 'click', async () => {
      $( `#infos_lobby_${lobbyId}` ).empty().remove();
      // Bloqueia todas as outras lupas enquanto carrega
      $.each( $( '.gcbooster_lupa' ), ( _, lupa ) => { lupa.style = 'display: none'; } );

      $( div ).parent().append( modal );

      const players = getPlayersIdsFunction( element );

      $( `#infos_lobby_${lobbyId}` ).append( createClose( lobbyId ) );

      // Cria spinners
      players.forEach( playerId => {
        const loadingDiv = $( '<div/>', {
          id: `loading-${playerId}`,
          class: 'gcbooster-info-player-loading'
        } ).append( $( '<div/>', {
          class: 'gcbooster-spinner'
        } ) );
        $( `#infos_lobby_${lobbyId}` ).append( loadingDiv );
      } );

      // Verifica configuração de audit
      const syncConfig = await new Promise( resolve => {
        chrome.storage.sync.get( [ 'playerAuditEnabled' ], resolve );
      } );
      const auditEnabled = syncConfig?.playerAuditEnabled !== false;

      // Carregar informações e auditoria em batch para performance máxima
      const [ playerInfoList, auditList ] = await Promise.all( [
        Promise.all( players.map( p => getPlayerInfo( p ).catch( () => ( {} ) ) ) ),
        auditEnabled ? auditPlayers( players ).catch( () => [] ) : Promise.resolve( [] )
      ] );

      players.forEach( ( player, idx ) => {
        const response = playerInfoList[idx];
        const audit = Array.isArray( auditList ) ?
          auditList.find( a => a && String( a.gcId ) === String( player ) ) : null;
        $( `#loading-${player}` ).replaceWith( createDivPlayers( response, audit, player ) );
      } );

      $.each( $( '.gcbooster_lupa' ), ( _, lupa ) => { lupa.style = 'display: flex'; } );
    } );
    element.append( div );
  }
};

export const scanAndInjectLupa = () => {
  // 1. Salas de desafio (.LobbyChallengeLineUpCard)
  $( '.LobbyChallengeLineUpCard' ).each( ( _, element ) => {
    const firstPlayerLink = $( element ).find( '.LobbyPlayerVertical, .sala-lineup-imagem a' )[0];
    const parts = firstPlayerLink?.href ? firstPlayerLink.href.split( '/' ).filter( Boolean ) : [];
    const lobbyId = parts.length > 0 ?
      `challenge_${parts[parts.length - 1]}` :
      `challenge_${$( element ).index()}`;
    createModalForElementNew( $( element ), getPlayersIds, 'challenge', lobbyId );
  } );

  // 2. Salas normais / lobby ([id^="roomCardWrapper-"])
  $( '[id^="roomCardWrapper-"]' ).each( ( _, element ) => {
    const lobbyId = $( element ).attr( 'id' );
    createModalForElementNew( $( element ), getPlayersIdsNew, 'lobby', lobbyId );
  } );
};

export const iniciarLupa = () => {
  // Executa imediatamente para salas já carregadas
  scanAndInjectLupa();

  // Observer com detecção rápida para novas salas inseridas
  const observer = new MutationObserver( () => {
    scanAndInjectLupa();
  } );
  observer.observe( document.body, { childList: true, subtree: true } );

  // Intervalo de segurança rápido nos primeiros 5s para garantia de 0 delay
  const intervalFast = setInterval( scanAndInjectLupa, 400 );
  setTimeout( () => {
    clearInterval( intervalFast );
    setInterval( scanAndInjectLupa, 1200 );
  }, 6000 );
};

export const infoChallenge = () => scanAndInjectLupa();
export const infoLobby = () => scanAndInjectLupa();
