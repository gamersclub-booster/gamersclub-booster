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
              const id = node.querySelector( 'a' ).getAttribute( 'href' ).replace( '/jogador/', '' );
              const nick = node.querySelector( 'a' ).getAttribute( 'title' ).split( ' | ' )[0];
              console.log( 'Entrou o ID ' + id + ' nick: ' + nick );
              if ( res.blockList.includes( id ) ) {
                alertaMsg( prefix + ': Essa pessoa: ' + nick + ' está na sua lista de bloqueio' );
              }
            }
          } );
        }
      }
    } );
  } );
