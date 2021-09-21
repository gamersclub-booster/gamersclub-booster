let interval = 1000;
let intervalId;

export function adicionarBotaoAutoComplete() {
  if ( !$( '#autoCompleteBtn' ).length ) { // Se precisa criar o botão e adicionar na página
    $( '#gcbooster_cabecalho' )
      .append( $( '<div/>', { 'class': 'FilterLobby_section__3UmYp' } )
        .append( $( '<p/>', { 'class': 'FilterLobby_sectionLabel__1zPew', 'text': 'GamersClub Booster', 'css': { 'color': 'orange' } } ) )
        .append( $( '<button/>', {
          'id': 'autoCompleteBtn',
          'class': 'WasdButton',
          'css': { 'background-color': 'orange', 'border-radius': '4px' },
          'type': 'button',
          'text': 'Completar Partida'
        } ) ) );
    addListeners();
  } else { // Se precisa apenas modificar o botão que já existe
    $( '#autoCompleteBtn' )
      .css( { 'background-color': 'orange', 'border-radius': '4px' } )
      .text( 'Completar Partida' )
      .removeClass( 'Cancelar' );
  }
}

function adicionarBotaoCancelar() {
  $( '#autoCompleteBtn' )
    .css( { 'background-color': 'red', 'border-radius': '4px' } )
    .text( 'Procurando Complete...' )
    .addClass( 'Cancelar' );
}

function addListeners() {
  $( '#autoCompleteBtn' ).on( 'click', function () {
    if ( $( '#autoCompleteBtn' ).hasClass( 'Cancelar' ) ) { // Se já estiver buscando
      clearInterval( intervalId );
      adicionarBotaoAutoComplete();
    } else { // Se não estiver buscando ainda
      if ( !$( '#SidebarSala' ).length ) { // Se não estiver em lobby
        intervalerAutoComplete();
        adicionarBotaoCancelar();
      } else { // Se estiver em lobby e tentar clicar no botão de complete
        alert( 'Você está em um lobby! Saia para buscar por complete!' );
      }
    }
  } );
}

function intervalerAutoComplete() {
  intervalId = setInterval( function () {
    if ( !$( '#SidebarSala' ).length ) { // Se não estiver em lobby ( acontece quando cria lobby e já está buscando complete )
      interval = randomIntFromInterval( 750, 4750 ); // Escolhe um novo intervalo aleatório entre 1s e 5s
      if ( $( '.scroll-content > li > .btn-actions > a.accept-btn' ).length ) {
        setTimeout( function () { // Espera tempo aleatório entre 1 e 5 segundos
          $( '.scroll-content > li > .btn-actions > a.accept-btn' ).get( 0 ).click();
          $( '#completePlayerModal > div > div.buttons > button.sm-button-accept.btn.btn-success' ).get( 0 ).click();
        }, interval );
      }
    } else {
      clearInterval( intervalId );
      adicionarBotaoAutoComplete();
    }
  }, 250 );
}

function randomIntFromInterval( min, max ) {
  return Math.floor( ( Math.random() * ( max - min + 1 ) ) + min );
}
