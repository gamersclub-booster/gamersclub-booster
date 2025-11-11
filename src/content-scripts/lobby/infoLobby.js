import { getPlayerInfo } from './getPlayerInfo';
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
  } ).append( 'X' ).on( 'click', () => $( `#infos_lobby_${lobbyId}` ).empty( ).remove() );



const createDivPlayers = playerInfo => $( '<div/>',
  {
    class: 'gcbooster-info-player'
  } )
  .append( createDivDateCreate( playerInfo ) )
  .append( createDivLobbys( playerInfo ) )
  .append( createDivVitory( playerInfo ) );

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

const calcAge = yearMonth => {
  if ( !yearMonth || !/^\d{4}-\d{2}$/.test( yearMonth ) ) {
    return 'Nova';
  }

  const [ year, month ] = yearMonth.split( '-' ).map( v => parseInt( v, 10 ) );
  const dataInicial = new Date( year, month - 1, 1 );
  const dataAtual = new Date();

  // Diferença em meses
  const meses = ( ( dataAtual.getFullYear() - dataInicial.getFullYear() ) * 12 ) + ( dataAtual.getMonth() - dataInicial.getMonth() );

  if ( meses <= 0 ) { return 'Nova'; }

  const anos = Math.floor( meses / 12 );
  const mesesRestantes = meses % 12;

  if ( anos > 0 ) {
    return `+${anos}a`;
  }

  return `${mesesRestantes}m`;
};


const getPlayersIdsNew = element => element
  .find( '.LobbyPlayerVertical' )
  .toArray()
  .map( e => e.href.split( '/' ).pop() );

const createModalForElementNew = ( element, getPlayersIdsFunction, type, lobbyId ) => {
  if ( element.find( `#gcbooster_lupa_${type}_${lobbyId}` ).length === 0 ) {
    const div = createDiv( lobbyId );
    const modal = createModal( lobbyId, type );
    const image = createImage( lobbyId );

    div.append( image );

    div.on( 'click', async () => {
      $( `#infos_lobby_${lobbyId}` ).empty( ).remove();
      //bloqueia todas as outras lupas enquanto carrega
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

      for ( const player of players ) {
        const response = await getPlayerInfo( player );
        $( `#loading-${player}` ).replaceWith( createDivPlayers( response ) );
      }
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
        // lobbyId existe, cria o elemento, mas não aparece na tela...
        const lobbyId = $( element ).find( '.LobbyPlayerVertical' )[0].href.replace( /[\W_]+/g, ' ' ).replaceAll( ' ', '_' );
        createModalForElementNew( $( element ), getPlayersIds, 'challenge', lobbyId );
      } );
  } );
};
export const infoLobby = mutations => {
  $.each( mutations, ( _, mutation ) => {
    $( mutation.addedNodes )
      .find( '.RoomCardWrapper' )
      .addBack( '.RoomCardWrapper' )
      .each( ( _, element ) => {
        const lobbyId = $( element ).attr( 'id' );
        createModalForElementNew( $( element ), getPlayersIdsNew, 'lobby', lobbyId );
      } );
  } );
};
