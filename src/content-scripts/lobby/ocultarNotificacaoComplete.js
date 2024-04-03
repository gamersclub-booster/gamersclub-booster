export const ocultarNotificacaoComplete = () =>
  chrome.storage.sync.get( [ 'ocultarNotificacaoComplete' ], function ( result ) {
    if ( result.ocultarNotificacaoComplete ) {
      document.body.classList.add( 'ocultar-notificacao-complete' );
    }
  } );
