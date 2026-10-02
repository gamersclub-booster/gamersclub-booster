import { isExtensionContextValid, waitForElement } from '../../utils';

export const ocultarNotificacaoComplete = async () => {
  await waitForElement( '#soundCompletePlayerReceived' );
  if ( !isExtensionContextValid() ) { return; }

  try {
    chrome.storage.sync.get( [ 'ocultarNotificacaoComplete' ], function ( result ) {
      if ( chrome.runtime?.lastError || !result ) { return; }
      if ( result.ocultarNotificacaoComplete ) {
        document.body.classList.add( 'ocultar-notificacao-complete' );

        const soundComplete = document.querySelector( '#soundCompletePlayerReceived' );
        if ( soundComplete ) { soundComplete.volume = 0; }
      }
    } );
  } catch ( _e ) {
    // Context invalidated
  }
};
