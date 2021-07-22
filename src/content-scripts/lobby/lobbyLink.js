import { sendLobby } from '../../lib/discord';
import { alertaMsg } from '../../lib/blockList';
import axios from 'axios';

export const lobbyLink = mutations =>
  chrome.storage.sync.get( [ 'webhookLink', 'enviarLinkLobby' ], function ( result ) {
    if ( result.webhookLink && result.webhookLink.length > 0 ) {
      mutations.forEach( async mutation => {
        if ( !mutation.addedNodes ) {
          return;
        }
        for ( let i = 0; i < mutation.addedNodes.length; i++ ) {
          const node = mutation.addedNodes[i];
          if (
            node.nextElementSibling &&
          node.nextElementSibling.className &&
          node.nextElementSibling.className.includes( 'sidebar-desafios sidebar-content' )
          ) {
            if ( result.webhookLink.startsWith( 'http' ) ) {
              if ( document.getElementById( 'discordLobbyButton' ) ) {
                return false;
              } else {
                if ( result.enviarLinkLobby ) {
                  const lobbyInfo = await axios.post( '/lobbyBeta/openRoom' );
                  await sendLobby( result.webhookLink, lobbyInfo.data );
                  alertaMsg( '[Discord] - Enviado com sucesso' );
                }
                if ( $( '.btn-radial.btn-blue.btn-copiar-link' ).length === 0 ) {
                  return false;
                }
                document
                  .getElementsByClassName( 'sidebar-titulo sidebar-sala-titulo' )[0]
                  .setAttribute( 'style', 'font-size: 12px;' );
                $( '.btn-radial.btn-blue.btn-copiar-link' )
                  .parent()
                  .append(
                    `<span class="btn-radial btn-blue btn-copiar-link" id="discordLobbyButton"
                     title="Enviar lobby Discord" data-jsaction="gcCommonTooltip" data-tip-text="Convidar Amigos">
                       <img src="https:img.icons8.com/material-sharp/18/ffffff/discord-logo.png"/>
                   </span>`
                  );

                document.getElementById( 'discordLobbyButton' ).addEventListener( 'click', async function () {
                  const lobbyInfo = await axios.post( '/lobbyBeta/openRoom' );
                  await sendLobby( result.webhookLink, lobbyInfo.data );
                  alertaMsg( '[Discord] - Enviado com sucesso' );
                } );
              }
            }
          }
        }
      } );
    }
  } );
