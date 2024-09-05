import axios from 'axios';
import { GC_URL } from '../../lib/constants';
import { sendLobby } from '../../lib/discord';
import { alertaMsg } from '../../lib/messageAlerts';

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
          node.nextElementSibling.className.includes( 'MyRoom' )
          ) {
            if ( result.webhookLink.startsWith( 'http' ) ) {
              if ( document.getElementById( 'discordLobbyButton' ) ) {
                return false;
              } else {
                if ( result.enviarLinkLobby ) {
                  const lobbyInfo = await axios.post( `https://${ GC_URL }/lobbyBeta/openRoom` );
                  await sendLobby( result.webhookLink, lobbyInfo.data );
                  alertaMsg( '[Discord] - Enviado com sucesso' );
                }
                // if ( $( '.btn-radial.btn-blue.btn-copiar-link' ).length === 0 ) {
                //   return false;
                // }

                const discordSvgUrl = chrome.runtime.getURL( '/images/discord.svg' );

                $( '.MyRoomHeader__actions' )
                  .prepend(
                    `<button
                      class="MyRoomHeader__button"
                      id="discordLobbyButton"
                      title="Excluir sala"title="Enviar lobby Discord"
                      data-jsaction="gcCommonTooltip"
                      data-tip-text="Convidar Amigos"
                      style="width:75px;margin-right:7px;background:#7289da"
                      >
                      <img src="${discordSvgUrl}" width="20px"/>
                    </button>`
                  );

                document.getElementById( 'discordLobbyButton' ).addEventListener( 'click', async function () {
                  const lobbyInfo = await axios.post( `https://${ GC_URL }/lobbyBeta/openRoom` );
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
