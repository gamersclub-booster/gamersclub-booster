let intervalAutoComplete = null;

export function adicionarBotaoAutoComplete() {
  if ( !$( '#lobbyContent > div.row.lobby-rooms-content > div > div > div:nth-child(4)' ).length ) {
    $( '#lobbyContent > div.row.lobby-rooms-content > div > div' ).append(
      '<div class="FilterLobby_section__3UmYp"><button id="autoCompleteBtn" style="color:orange" type="button">Auto Complete</button></div>'
    );
  } else {
    $( '#lobbyContent > div.row.lobby-rooms-content > div > div > div:nth-child(4)' ).html(
      '<button id="autoCompleteBtn" style="color:orange" type="button">Auto Complete</button>'
    );
  }
  document.getElementById( 'autoCompleteBtn' ).addEventListener( 'click', function () {
    intervalAutoComplete = intervalerAutoComplete();
    adicionarBotaoCancelar();
  } );
}

function adicionarBotaoCancelar() {
  $( '#lobbyContent > div.row.lobby-rooms-content > div > div > div:nth-child(4)' ).html(
    `<span style="color:orange">ESPERANDO PARA COMPLETAR...</span>
        <button id="cancelarAutoCompleteBtn" style="color:red" type="button">Cancelar Complete</button>`
  );
  document.getElementById( 'cancelarAutoCompleteBtn' ).addEventListener( 'click', function () {
    clearInterval( intervalAutoComplete );
    adicionarBotaoAutoComplete();
  } );
}

function intervalerAutoComplete() {
  setInterval( async () => {
    $( '.scroll-content > li > .btn-actions > a.accept-btn' ).get( 0 ).click();
    $( '#completePlayerModal > div > div.buttons > button.sm-button-accept.btn.btn-success' ).get( 0 ).click();
  }, 500 );
}
