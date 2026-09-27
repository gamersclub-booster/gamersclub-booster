import { isExtensionContextValid } from '../../utils';

export const ocultarSugestaoDeLobbies = () => {
  if ( !isExtensionContextValid() ) { return; }
  try {
    chrome.storage.sync.get( [ 'ocultarSugestaoDeLobbies' ], function ( result ) {
      if ( chrome.runtime?.lastError || !result ) { return; }
      if ( result.ocultarSugestaoDeLobbies ) {
        document.body.classList.add( 'ocultar-sugestao-de-lobbies' );
      }
    } );
  } catch ( _e ) {
    // Context invalidated
  }
};
