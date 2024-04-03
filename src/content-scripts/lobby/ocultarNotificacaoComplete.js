import { waitForElement } from '../../utils';

export const ocultarNotificacaoComplete = async () => {
  await waitForElement( '#soundCompletePlayerReceived' );

  chrome.storage.sync.get( [ 'ocultarNotificacaoComplete' ], function ( result ) {
    if ( result.ocultarNotificacaoComplete ) {
      document.body.classList.add( 'ocultar-notificacao-complete' );

      const soundComplete = document.querySelector( '#soundCompletePlayerReceived' );
      if ( soundComplete ) { soundComplete.volume = 0; }
    }
  } );
};
