import { alertaMsg } from '../../lib/messageAlerts';

export const listaBloqueio = mutations =>
  chrome.storage.sync.get( [ 'blockList' ], function ( ) {
    const prefix = '<a style="color: yellow;">[ Lista de Bloqueio ] - </a>';
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

              const id = selectorLink.getAttribute( 'href' ).replace( '/jogador/', '' );
              const nick = selectorLink.getAttribute( 'title' ).split( ' | ' )[0];
              if ( res.blockList.includes( id ) ) {
                alertaMsg( prefix + ': Essa pessoa: ' + nick + ' está na sua lista de bloqueio' );
              }
            }
          } );
        }
      }
    } );
  } );
