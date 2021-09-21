let intervalAutoComplete = null;

export function adicionarBotaoAutoComplete() {
  if ( !$( '#autoCompleteBtn' ).length ) {
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
  } else {
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
  document.getElementById( 'autoCompleteBtn' ).addEventListener( 'click', function () {
    if ( $( '#autoCompleteBtn' ).hasClass( 'Cancelar' ) ) {
      clearInterval( intervalAutoComplete );
      adicionarBotaoAutoComplete();
    } else {
      intervalAutoComplete = intervalerAutoComplete();
      adicionarBotaoCancelar();
    }
  } );
}

function intervalerAutoComplete() {
  setInterval( async () => {
    $( '.scroll-content > li > .btn-actions > a.accept-btn' ).get( 0 ).click();
    $( '#completePlayerModal > div > div.buttons > button.sm-button-accept.btn.btn-success' ).get( 0 ).click();
  }, 500 );
}
