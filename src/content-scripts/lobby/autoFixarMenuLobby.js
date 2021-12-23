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
              $ ( node ).css( {
                'position': 'absolute',
                'left': '0',
                'top': '33px',
                'width': '227px',
                'border-radius': '0 6px 6px 0',
                'background': '#2c2d3d',
                'z-index': '4',
                'paddin': '12px 8px',
                'bottom': 'auto'
              } );
            }
            if ( node.className.includes( 'sidebar-desafios sidebar-content' ) ) {
              if ( !isSubscriber ) {
                $( node ).css( {
                  position: 'fixed',
                  top: '22%',
                  right: '72px',
                  bottom: 'auto'
                } );
              } else {
                $( node ).css( {
                  position: 'fixed',
                  top: '20%',
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
