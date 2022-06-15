import { alertaMsg } from '../../lib/messageAlerts';
import { levelColor } from '../../lib/constants';

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
              const kdr = selectorLink.getAttribute( 'title' ).split( ' | ' )[1];

              const searchKdr = kdr.split( ' ' )[1];

              const colorKrdDefault = searchKdr <= 2 ? '#000' :
                'linear-gradient(135deg, rgba(0,255,222,0.8) 0%, rgba(245,255,0,0.8) 30%, rgba(255,145,0,1) 60%, rgba(166,0,255,0.8) 100%)';
              const colorKdr = searchKdr <= 2 ? levelColor[Math.round( searchKdr * 10 )] : colorKrdDefault;

              const kdrDiv = document.createElement( 'span' );
              kdrDiv.style = `background: ${colorKdr};padding:2px 4px;position:absolute;top:0;right:0;z-index:5;font-size:11px;`;
              kdrDiv.innerHTML = searchKdr;

              // node.querySelector( '.sidebar-item-meta ' ).append( `${searchKdr}` );
              // node.querySelector( '.sidebar-item-meta ' ).append( $( `div style="'background-color': ${colorKdr}">${searchKdr}</div> ` ) );
              node.querySelector( '.sidebar-item-meta ' ).append( kdrDiv );

              // console.log( searchKdr, 'searchKdr' );
              // console.log( 'node', node );
              // console.log( 'Entrou o ID ' + id + ' nick: ' + nick );
              if ( res.blockList.includes( id ) ) {
                alertaMsg( prefix + ': Essa pessoa: ' + nick + ' está na sua lista de bloqueio' );
              }
            }
          } );
        }
      }
    } );
  } );
