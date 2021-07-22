import { retrieveWindowVariables } from '../../lib/dom';

export const autoFixarMenuLobby = mutations =>
  chrome.storage.sync.get( [ 'autoFixarMenuLobby' ], function ( result ) {
    if ( result.autoFixarMenuLobby ) {
      const windowVariables = retrieveWindowVariables( [ 'ISSUBSCRIBER' ] );
      const isSubscriber = windowVariables.ISSUBSCRIBER;
      mutations.forEach( mutation => {
        if ( !mutation.addedNodes ) { return; }

        for ( let i = 0; i < mutation.addedNodes.length; i++ ) {
          const node = mutation.addedNodes[i];
          if ( typeof node.id !== 'undefined' ) {
            if ( node.id.includes( 'SidebarSala' ) ) {
              if ( !isSubscriber ) {
                $( node ).css( {
                  position: 'fixed',
                  top: '130px',
                  bottom: 'auto'
                } );
              } else {
                $( node ).css( {
                  position: 'fixed',
                  top: '10%',
                  bottom: 'auto'
                } );
              }
            }
            if ( node.className.includes( 'sidebar-desafios sidebar-content' ) ) {
              if ( !isSubscriber ) {
                $( node ).css( {
                  position: 'fixed',
                  top: '130px',
                  right: '72px',
                  bottom: 'auto'
                } );
              } else {
                $( node ).css( {
                  position: 'fixed',
                  top: '10%',
                  right: '72px',
                  bottom: 'auto'
                } );
              }
            }
          }
        }
      } );
    }
  } );
