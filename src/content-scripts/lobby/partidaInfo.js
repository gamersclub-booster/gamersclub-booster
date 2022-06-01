import { sendMatchInfo } from '../../lib/discord';
import { GC_URL } from '../../lib/constants';
import axios from 'axios';

export const partidaInfo = async () => {
  chrome.storage.sync.get( [ 'webhookLink', 'enviarPartida' ], function ( result ) {
    if ( result.webhookLink && result.webhookLink.length > 0 ) {
      setInterval( async () => {
        const selector = '.Disclaimer-sc-1ylcea4-5';
        const disclaimerInput = $( selector );
        if ( disclaimerInput && !document.getElementById( 'botaoDiscordnoDOM' ) ) {
          $( '.Container-sc-1ylcea4-0' )
            .parent()
            .append(
              `<button id="botaoDiscordnoDOM" class="WasdButton WasdButton--success WasdButton--lg botaoDiscordnoDOM-sc-1ylcea4-4"
              data-tip-text="Clique para enviar no discord">Enviar no Discord</button>`
            );
          const listenGame = await axios.get( `https://${ GC_URL }/api/lobby/match` );
          if ( listenGame?.data?.data?.step === 'onServerReady' ) {
            document.getElementById( 'botaoDiscordnoDOM' ).addEventListener( 'click', async function () {
              await sendMatchInfo( result.webhookLink, listenGame.data.data );
            } );
            if ( result.enviarPartida ) {
              await sendMatchInfo( result.webhookLink, listenGame.data.data );
            }
          }
        }
      }, 3000 );
    }
  } );
};
