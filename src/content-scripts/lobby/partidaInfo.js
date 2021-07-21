import { sendMatchInfo } from '../../lib/discord';
import axios from 'axios';

export const partidaInfo = mutations => {
  chrome.storage.sync.get( [ 'webhookLink', 'enviarPartida' ], function ( result ) {
    if ( result.webhookLink && result.webhookLink.length > 0 ) {
      $.each( mutations, async ( _i, mutation ) => {
        const addedNodes = $( mutation.addedNodes );
        const selector = '.CopyButton-sc-1ylcea4-3';
        const ipInput = addedNodes.find( selector ).addBack( selector );
        if ( ipInput ) {
          if ( document.getElementById( 'botaoDiscordnoDOM' ) ) {
            return false;
          } else {
            const listenGame = await axios.get( '/api/lobby/match' );
            if ( listenGame.data.data.step === 'onServerReady' ) {
              $( '.Container-sc-1ylcea4-0' )
                .parent()
                .append(
                  `<button id="botaoDiscordnoDOM" class="WasdButton WasdButton--success WasdButton--lg botaoDiscordnoDOM-sc-1ylcea4-4"
                  data-tip-text="Clique para enviar no discord">Enviar no Discord</button>`
                );
              document.getElementById( 'botaoDiscordnoDOM' ).addEventListener( 'click', async function () {
                await sendMatchInfo( result.webhookLink, listenGame.data.data );
              } );
              if ( result.enviarPartida ) {
                await sendMatchInfo( result.webhookLink, listenGame.data.data );
              }
            }
          }
        }
      } );
    }
  } );
};
