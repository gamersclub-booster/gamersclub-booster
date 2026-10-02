import { isExtensionContextValid } from '../../utils';

export const autoFixarMenuLobby = mutations => {
  if ( !isExtensionContextValid() ) { return; }
  try {
    chrome.storage.sync.get( [ 'autoFixarMenuLobby' ], function ( result ) {
      if ( chrome.runtime?.lastError || !result ) { return; }
      if ( result.autoFixarMenuLobby ) {
        mutations.forEach( mutation => {
          if ( !mutation.addedNodes ) { return; }

          for ( let i = 0; i < mutation.addedNodes.length; i++ ) {
            const node = mutation.addedNodes[i];
            if ( typeof node.id !== 'undefined' ) {
              if ( node.className.includes( 'sidebar-desafios sidebar-content' ) ) {
                $( node ).parent().addClass( 'with-fixed-menu' );
              }
            }
          }
        } );
      }
    } );
  } catch ( _e ) {
    // Context invalidated
  }
};
