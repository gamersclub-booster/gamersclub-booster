import { getPlayerInfo } from './getPlayerInfo';
const IMAGE_ALT = '[GC Booster]: Buscar informações da lobby';

const createDiv = lobbyId => $( '<div/>',
  {
    id: `gcbooster_lupa_${lobbyId}`,
    class: 'gcbooster_lupa',
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
    class: 'gcbooster-info-close',
    title: 'Fechar',
    'data-tip-text': 'Fechar'
  } ).append( 'X' ).on( 'click', () => $( `#infos_lobby_${lobbyId}` ).empty( ).remove() );


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

const createDivPlayers = playerInfo => $( '<div/>',
  {
    class: 'gcbooster-info-player'
  } )
  .append( createDivDateCreate( playerInfo ) )
  .append( createDivLobbys( playerInfo ) )
  .append( createDivVitory( playerInfo ) )
  .append( createDivAnotacao( playerInfo ) );

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
      for ( const player of players ) {
        const response = await getPlayerInfo( player );
        $( `#infos_lobby_${lobbyId}` ).append( createDivPlayers( response ) );
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
