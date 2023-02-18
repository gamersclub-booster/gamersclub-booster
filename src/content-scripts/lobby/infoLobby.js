import { getPlayerInfo } from './getPlayerInfo';


const CreateModalForElement = element => {
  if ( element.find( '#gcbooster_lupa' ).length === 0 ) {
    const div = createDiv();
    const modal = createModal();
    const image = createImage();

    div.append( image );

    div.on( 'click', async () => {
      $( '#infos_lobby' ).empty( ).remove();

      $( div ).parent().append( modal );

      const players = getPlayersIds( element );
      console.log( players );

      $( '#infos_lobby' ).append( createDivTitle() ).append( createClose() );
      for ( const player of players ) {
        const response = await getPlayerInfo( player );
        $( '#infos_lobby' ).append( createDivPlayers( response ) );
      }
    } );
    element.append( div );
  }
};

export const infoChallenge = mutations => {
  $.each( mutations, ( _, mutation ) => {
    $( mutation.addedNodes )
      .find( 'div.sidebar-desafios-team-prime' ).addBack( 'div.sala-lineup-players' )
      .each( ( _, element ) => {
        CreateModalForElement( $( element ) );
      } );
  } );
};

export const infoLobby = mutations => {
  $.each( mutations, ( _, mutation ) => {
    $( mutation.addedNodes )
      .find( 'div.sala-card-content' )
      .addBack( 'div.sala-card-content' )
      .each( ( _, element ) => {
        CreateModalForElement( $( element ) );
      } );
  } );
};

const IMAGE_ALT = 'Buscar informações da lobby';

function createDiv( ) {
  return $( '<div/>',
    {
      id: 'gcbooster_lupa',
      title: IMAGE_ALT,
      'data-tip-text': IMAGE_ALT
    } );
}


function createDivVitory( playerInfo ) {
  return $( '<div />',
    {
      'class': 'gcbooster-info-vitoria',
      title: 'Porcentagem de vitória',
      'data-tip-text': 'Porcentagem de vitória'
    } ).append( `%: ${Math.round( playerInfo.porcentagemVitoria )}%` );
}

function createDivDateCreate( playerInfo ) {
  return $( '<div />',
    {
      'class': 'gcbooster-info-date-create',
      title: 'Tempo de conta',
      'data-tip-text': 'Tempo de conta'
    } ).append( `T: ${calcAge( playerInfo.dataCriacao )}` );
}

function createDivLobbys( playerInfo ) {
  return $( '<div />',
    {
      'class': 'gcbooster-info-lobbyes',
      title: 'Partidas jogadas',
      'data-tip-text': 'Partidas jogadas'
    } ).append( `P: ${playerInfo.totalPartidas}` );
}

function createDivLobbysWin( playerInfo ) {
  return $( '<div />',
    {
      'class': 'gcbooster-info-lobbyes-win',
      title: 'Vitórias',
      'data-tip-text': 'Vitórias'
    } ).append( `V: ${playerInfo.totalVitorias}` );
}

function createClose( ) {
  return $( '<div />',
    {
      'class': 'gcbooster-info-close',
      title: 'Fechar',
      'data-tip-text': 'Fechar'
    } ).append( 'X' ).on( 'click', () => $( '#infos_lobby' ).empty( ).remove() );
}


function createDivLobbysLose( playerInfo ) {
  return $( '<div />',
    {
      'class': 'gcbooster-info-lobbyes-lose',
      title: 'Derrotas',
      'data-tip-text': 'Derrotas'
    } ).append( `D: ${playerInfo.totalDerrotas}` );
}


function createDivTitle( ) {
  return $( '<div />',
    {
      'class': 'gcbooster-info-titles',
      title: 'Informações dos jogadores',
      'data-tip-text': 'Informações dos jogadores'
    } ).append( 'Estatisticas' );
}


function createDivPlayers( playerInfo ) {
  return $( '<div/>',
    {
      'class': 'gcbooster-info-player'
    } )
    .append( createDivDateCreate( playerInfo ) )
    .append( createDivLobbys( playerInfo ) )
    .append( createDivLobbysWin( playerInfo ) )
    .append( createDivLobbysLose( playerInfo ) )
    .append( createDivVitory( playerInfo ) )
  ;



  // $( '#gcbooster_info_player' ).append( response.porcentagemVitoria );
  // $( '#gcbooster_info_player' ).append( response.dataCriacao );
  // $( '#gcbooster_info_player' ).append( response.totalDerrotas );
  // $( '#gcbooster_info_player' ).append( response.totalPartidas );
  // $( '#gcbooster_info_player' ).append( response.totalVitorias );
}

function createImage() {
  return $( '<img/>', {
    id: 'gcbooster_lupa_img',
    width: '20px',
    src: 'https://i.postimg.cc/yxSCmnZc/lupa.png',
    title: IMAGE_ALT,
    'data-tip-text': IMAGE_ALT
  } );
}

function getPlayersIds( element ) {
  return element
    .find( '.sala-lineup-player:not(.player-placeholder)' )
    .find( '.gc-avatar, .sala-lineup-imagem' )
    .children( 'a' )
    .toArray()
    .map( e => e.href.split( '/' ).pop() );
}

function createModal() {
  return $( '<div />',
    {
      'id': 'infos_lobby',
      title: 'Estatísticas'
    } );
}

createModal();

function calcAge( ageDate ) {
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

  let message = '';

  if ( years > 0 ) {
    message += `+${years}a`;
    // if ( years > 1 ) {
    //   message += `+${years} anos`;
    // } else {
    //   message += `+${years} ano`;
    // }
  } else {
    if ( finalMonths > 0 ) {
      message += `${finalMonths}m`;
    }
  }

  if ( years <= 0 && finalMonths <= 0 ) {
    message += 'Novo(a)';
  }

  return message;
}

