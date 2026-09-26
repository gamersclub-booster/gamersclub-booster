import { getPlayerInfo } from './getPlayerInfo';
import { auditPlayers } from '../../lib/playerAudit';

const IMAGE_ALT = '[GC Booster]: Buscar informações da lobby';

const createDiv = lobbyId => $( '<div/>',
  {
    id: `gcbooster_lupa_${lobbyId}`,
    class: 'gcbooster_lupa draw-orange',
    title: IMAGE_ALT
  } );

const createDivVitory = playerInfo => $( '<div />',
  {
    'class': 'gcbooster-info-vitoria gcbooster-padding-bottom',
    title: 'Porcentagem de vitória',
    'data-tip-text': 'Porcentagem de vitória'
  } ).append( `%: ${!isNaN( playerInfo.porcentagemVitoria ) ? Math.round( playerInfo.porcentagemVitoria ) : 0}% ` );

const createDivDateCreate = playerInfo => $( '<div />',
  {
    class: 'gcbooster-info-date-create gcbooster-padding-bottom',
    title: 'Tempo de conta',
    'data-tip-text': 'Tempo de conta'
  } ).append( `T: ${calcAge( playerInfo.dataCriacao )}` );

const createDivLobbys = playerInfo => $( '<div />',
  {
    class: 'gcbooster-info-lobbyes gcbooster-padding-bottom',
    title: 'Partidas jogadas',
    'data-tip-text': 'Partidas jogadas'
  } ).append( `P: ${playerInfo.totalPartidas}` );

const createClose = lobbyId => $( '<div />',
  {
    class: 'gcbooster-info-close draw-orange',
    title: 'Fechar',
    'data-tip-text': 'Fechar'
  } ).append( 'X' ).on( 'click', () => $( `#infos_lobby_${lobbyId}` ).empty().remove() );

const createDivAnotacao = playerInfo => $( '<div />',
  {
    class: 'gcbooster-info-lobbyes-anotacao',
    title: 'Anotação',
    'data-tip-text': 'Anotação'
  } ).append( `A: ${
  // eslint-disable-next-line no-nested-ternary
  playerInfo.anotacao === 'Positiva' ? '👍' :
    playerInfo.anotacao === 'Negativa' ? '👎' : '-'
}` );

const createDivAudit = audit => {
  if ( !audit ) { return ''; }

  const $auditDiv = $( '<div />', {
    class: 'gcbooster-info-audit gcbooster-padding-bottom',
    style: 'border-top: 1px solid rgba(255, 165, 0, 0.25); margin-top: 2px; padding-top: 2px;'
  } );

  let statusText = 'Steam: OK';
  let statusColor = '#2ecc71';

  if ( audit.vacBanned || audit.numberOfGameBans > 0 ) {
    statusText = `⛔ BAN (${audit.numberOfVACBans + audit.numberOfGameBans}x)`;
    statusColor = '#e74c3c';
  } else if ( audit.riskLevel === 'suspect' ) {
    statusText = '⚠️ Suspeito';
    statusColor = '#f39c12';
  } else if ( audit.noApiKey ) {
    statusText = '🛡️ Raio-X';
    statusColor = '#667eea';
  }

  $auditDiv.append( $( '<div />', {
    text: statusText,
    style: `font-size: 9px; font-weight: 700; color: ${statusColor}; white-space: nowrap;`
  } ) );

  if ( audit.cs2Hours !== null && audit.cs2Hours !== undefined ) {
    $auditDiv.append( $( '<div />', {
      text: `${audit.cs2Hours}h CS2`,
      style: 'font-size: 9px; opacity: 0.85;'
    } ) );
  }

  if ( audit.csrepUrl ) {
    $auditDiv.append( $( '<a />', {
      class: 'gcbooster-csrep-btn',
      href: audit.csrepUrl,
      target: '_blank',
      rel: 'noopener noreferrer',
      text: '🔍 csREP',
      title: 'Abrir auditoria completa no csREP.gg',
      style: 'font-size: 8px; padding: 1px 4px; margin-top: 2px; display: inline-flex; justify-content: center;'
    } ) );
  }

  return $auditDiv;
};

const createDivPlayers = ( playerInfo, audit ) => $( '<div/>',
  {
    class: 'gcbooster-info-player'
  } )
  .append( createDivDateCreate( playerInfo ) )
  .append( createDivLobbys( playerInfo ) )
  .append( createDivVitory( playerInfo ) )
  .append( createDivAnotacao( playerInfo ) )
  .append( createDivAudit( audit ) );

const createImage = lobbyId => $( '<img/>', {
  id: `gcbooster_lupa_img_${lobbyId}`,
  width: '20px',
  src: 'https://i.postimg.cc/yxSCmnZc/lupa.png',
  title: IMAGE_ALT,
  'data-tip-text': IMAGE_ALT
} );

const getPlayersIds = element => element
  .find( '.LobbyPlayerVertical' )
  .toArray()
  .map( e => e.href.split( '/' ).pop() );

const createModal = ( lobbyId, type ) => $( '<div />',
  {
    id: `infos_lobby_${lobbyId}`,
    class: 'infos_lobby',
    style: type === 'challenge' ? 'top: 135px' : undefined,
    title: 'Estatísticas'
  } );

const calcAge = ageDate => {
  const dateNow = new Date();

  const s = ageDate;
  const [ dia, mes, ano ] = s.split( /[/: ]/ ).map( v => parseInt( v ) );
  const dataFormated = new Date( ano, mes - 1, dia );

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

const getPlayersIdsNew = element => element
  .find( '.LobbyPlayerVertical' )
  .toArray()
  .map( e => e.href.split( '/' ).pop() );

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

      // Carregar jogadores em paralelo para performance máxima
      await Promise.all( players.map( async player => {
        try {
          const [ response, auditList ] = await Promise.all( [
            getPlayerInfo( player ),
            auditPlayers( [ player ] ).catch( () => [] )
          ] );
          $( `#loading-${player}` ).replaceWith( createDivPlayers( response, auditList?.[0] ) );
        } catch ( e ) {
          console.error( 'Error loading player info:', e );
        }
      } ) );

      $.each( $( '.gcbooster_lupa' ), ( _, lupa ) => { lupa.style = 'display: flex'; } );
    } );
    element.append( div );
  }
};

export const infoChallenge = mutations => {
  $.each( mutations, ( _, mutation ) => {
    $( mutation.addedNodes )
      .find( '.LobbyChallengeLineUpCard' )
      .addBack( '.LobbyChallengeLineUpCard' )
      .each( ( _, element ) => {
        const lobbyId = $( element ).find( '.LobbyPlayerVertical' )[0].href.replace( /[\W_]+/g, ' ' ).replaceAll( ' ', '_' );
        createModalForElementNew( $( element ), getPlayersIds, 'challenge', lobbyId );
      } );
  } );
};

export const infoLobby = mutations => {
  $.each( mutations, ( _, mutation ) => {
    $( mutation.addedNodes )
      .find( '[id^="roomCardWrapper-"]' )
      .addBack( '[id^="roomCardWrapper-"]' )
      .each( ( _, element ) => {
        const lobbyId = $( element ).attr( 'id' );
        createModalForElementNew( $( element ), getPlayersIdsNew, 'lobby', lobbyId );
      } );
  } );
};
