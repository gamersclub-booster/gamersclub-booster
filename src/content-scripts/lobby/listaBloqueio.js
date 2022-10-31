import { alertaMsg } from '../../lib/messageAlerts';

export const listaBloqueio = mutations =>
  chrome.storage.sync.get( [ 'blockList' ], function ( ) {
    mutations.forEach( async mutation => {
      if ( !mutation.addedNodes ) {
        return;
      }
      for ( let i = 0; i < mutation.addedNodes.length; i++ ) {
        const node = mutation.addedNodes[i];

        if ( node.className && node.className.includes( 'sidebar-item' ) ) {
          chrome.storage.sync.get( [ 'blockList' ], function ( res ) {
            if ( res.blockList ) {
              const selectorLink = node.querySelector( 'a' );

              const id = selectorLink.getAttribute( 'href' ).replace( '/player/', '' );

              if ( res.blockList.some( item => item.id.split( '/' ).at( -1 ) === id ) ) {
                $( `a[href*="/player/${id}"]` ).parents( '.sidebar-item' ).addClass( 'blocked' );
                alertaMsg( 'Você tem uma pessoa sua lista de bloqueio' );
              }
            }
          } );
        }
      }
    } );
  } );
