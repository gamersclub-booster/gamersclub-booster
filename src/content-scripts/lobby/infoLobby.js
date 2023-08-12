import { getPlayerInfo } from './getPlayerInfo';
const IMAGE_ALT = 'Buscar informações da lobby';

const createModalForElement = element => {
  const lobbyId = $( element ).find( 'h1.sala-card-title' ).text().replace( /[\W_]+/g, ' ' ).replaceAll( ' ', '_' );
  if ( element.find( `#gcbooster_lupa_${lobbyId}` ).length === 0 ) {
    const div = createDiv( lobbyId );
    const modal = createModal( lobbyId );
    const image = createImage( lobbyId );

    div.append( image );

    div.on( 'click', async () => {
      $( `#infos_lobby_${lobbyId}` ).empty( ).remove();
      //bloqueia todas as outras lupas enquanto carrega
      $.each( $( '.gcbooster_lupa' ), ( _, lupa ) => { lupa.style = 'display: none'; } );

      $( div ).parent().append( modal );

      const players = getPlayersIds( element );

      $( `#infos_lobby_${lobbyId}` ).append( createDivTitle() ).append( createClose( lobbyId ) );
      for ( const player of players ) {
        const response = await getPlayerInfo( player );
        $( `#infos_lobby_${lobbyId}` ).append( createDivPlayers( response ) );
      }
      $.each( $( '.gcbooster_lupa' ), ( _, lupa ) => { lupa.style = 'display: flex'; } );
    } );
    element.append( div );
  }
};

const createDiv = lobbyId => $( '<div/>',
  {
    id: `gcbooster_lupa_${lobbyId}`,
    class: 'gcbooster_lupa',
    title: IMAGE_ALT,
    'data-tip-text': IMAGE_ALT
  } );

const createDivVitory = playerInfo => $( '<div />',
  {
    'class': 'gcbooster-info-vitoria',
    title: 'Porcentagem de vitória',
    'data-tip-text': 'Porcentagem de vitória'
  } ).append( `%: ${Math.round( playerInfo.porcentagemVitoria )}%` );

const createDivDateCreate = playerInfo => $( '<div />',
  {
    class: 'gcbooster-info-date-create',
    title: 'Tempo de conta',
    'data-tip-text': 'Tempo de conta'
  } ).append( `T: ${calcAge( playerInfo.dataCriacao )}` );

const createDivLobbys = playerInfo => $( '<div />',
  {
    class: 'gcbooster-info-lobbyes',
    title: 'Partidas jogadas',
    'data-tip-text': 'Partidas jogadas'
  } ).append( `P: ${playerInfo.totalPartidas}` );

const createDivLobbysWin = playerInfo => $( '<div />',
  {
    class: 'gcbooster-info-lobbyes-win',
    title: 'Vitórias',
    'data-tip-text': 'Vitórias'
  } ).append( `V: ${playerInfo.totalVitorias}` );

const createClose = lobbyId => $( '<div />',
  {
    class: 'gcbooster-info-close',
    title: 'Fechar',
    'data-tip-text': 'Fechar'
  } ).append( 'X' ).on( 'click', () => $( `#infos_lobby_${lobbyId}` ).empty( ).remove() );

const createDivLobbysLose = playerInfo => $( '<div />',
  {
    class: 'gcbooster-info-lobbyes-lose',
    title: 'Derrotas',
    'data-tip-text': 'Derrotas'
  } ).append( `D: ${playerInfo.totalDerrotas}` );

const createDivTitle = () => $( '<div />',
  {
    class: 'gcbooster-info-titles',
    title: 'Informações dos jogadores',
    'data-tip-text': 'Informações dos jogadores'
  } ).append( 'Estatisticas' );

const createDivPlayers = playerInfo => $( '<div/>',
  {
    class: 'gcbooster-info-player'
  } )
  .append( createDivDateCreate( playerInfo ) )
  .append( createDivLobbys( playerInfo ) )
  .append( createDivLobbysWin( playerInfo ) )
  .append( createDivLobbysLose( playerInfo ) )
  .append( createDivVitory( playerInfo ) );

const createImage = lobbyId => $( '<img/>', {
  id: `gcbooster_lupa_img_${lobbyId}`,
  width: '20px',
  src: 'https://i.postimg.cc/yxSCmnZc/lupa.png',
  title: IMAGE_ALT,
  'data-tip-text': IMAGE_ALT
} );

const getPlayersIds = element => element
  .find( '.sala-lineup-player:not(.player-placeholder)' )
  .find( 'a' )
  // .children( 'a' )
  .toArray()
  .map( e => e.href.split( '/' ).pop() );

const createModal = lobbyId => $( '<div />',
  {
    id: `infos_lobby_${lobbyId}`,
    class: 'infos_lobby',
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

  return 'Novo(a)';
};

export const infoChallenge = mutations => {
  $.each( mutations, ( _, mutation ) => {
    $( mutation.addedNodes )
      .find( 'div.sidebar-desafios-team-prime' ).addBack( 'div.sala-lineup-players' )
      .each( ( _, element ) => {
        createModalForElement( $( element ) );
      } );
  } );
};

export const infoLobby = mutations => {
  $.each( mutations, ( _, mutation ) => {
    $( mutation.addedNodes )
      .find( 'div.sala-card-content' )
      .addBack( 'div.sala-card-content' )
      .each( ( _, element ) => {
        createModalForElement( $( element ) );
      } );
  } );
};
