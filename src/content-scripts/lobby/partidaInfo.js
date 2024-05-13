import axios from 'axios';
import { GC_URL } from '../../lib/constants';
import { sendMatchInfo } from '../../lib/discord';
import { getAllStorageSyncData, getTranslationText } from '../../utils';

const colors = [
  { val: 300, color: 'chartreuse' },
  { val: 120, color: 'greenyellow' },
  { val: 60, color: 'yellow' },
  { val: 30, color: 'orange' },
  { val: 0, color: 'orangered' }
];

const getColor = argVal => ( colors.find( ( { val } ) => ( argVal > val ) ) || colors[0] ).color;

export const buildTimer = ( warmupFinished, targetContainer, timeleft, maxtime = 300 ) => {

  const timeUtil = input => `${Math.floor( input / 60 ) > 0 ? `${Math.floor( input / 60 )}min ` : ''}${Math.floor( input % 60 )}s`;

  const endTime = Math.floor( Date.now() / 1000 ) + timeleft;
  let baseContent = `
          <div id="warmup_left_wrapper" title="[GC Booster]: Tempo restante">Warmup: 
            <b style="color: ${getColor( timeleft )}">${timeUtil( timeleft )}</b>
          </div>
          <progress style="accent-color: ${getColor( timeleft )}" id="warmup_progressbar" value="${timeleft}" max="${maxtime}"></progress>`;
  if ( timeleft === 0 ) { baseContent = warmupFinished; }
  targetContainer.append( `<div id="warmup_timer">${baseContent}</div>` );
  const x = setInterval( function () {
    const distance = endTime - Math.floor( Date.now() / 1000 );
    $( '#warmup_progressbar' ).attr( 'value', distance );
    $( '#warmup_left_wrapper > b' ).html( timeUtil( distance ) );
    $( '#warmup_left_wrapper > b' ).css( 'color', getColor( distance ) );
    $( '#warmup_progressbar' ).css( 'accent-color', getColor( distance ) );

    if ( distance < 0 ) {
      clearInterval( x );
      $( '#warmup_timer' ).html( warmupFinished );
    }
  }, 1000 );
  return x;
};

export const partidaInfo = async () => {
  const { traducao } = await getAllStorageSyncData();
  const warmupFinished = getTranslationText( 'warmup-fim', traducao );

  chrome.storage.sync.get( [ 'webhookLink', 'enviarPartida', 'warmupTimer' ], function ( result ) {
    const needDisc = result.webhookLink && result.webhookLink.length > 0;
    const needWarmup = result.warmupTimer;
    if ( needDisc || needWarmup ) {
      setInterval( async () => {
        const selector = '.Disclaimer-sc-1ylcea4-5';
        const disclaimerInput = $( selector );
        const discElement = document.getElementById( 'botaoDiscordNoDOM' );
        const warmupElement = document.getElementById( 'warmup_timer' );

        if ( disclaimerInput ) {
          const parentDisclaimer = $( '.Container-sc-1ylcea4-0' ).parent();
          if ( ( needDisc && !discElement ) || ( needWarmup && !warmupElement ) ) {
            const listenGame = await axios.get( `https://${GC_URL}/api/lobby/match` );
            if ( listenGame?.data?.data?.step === 'onServerReady' ) {

              if ( needWarmup && !warmupElement ) {
                buildTimer( warmupFinished, parentDisclaimer, listenGame.data.data.warmupExpiresInSeconds );
              }
              if ( needDisc && !discElement ) {
                parentDisclaimer.append(
                  `<button id="botaoDiscordNoDOM" class="WasdButton WasdButton--success WasdButton--lg botaoDiscordNoDOM-sc-1ylcea4-4"
                  title="[GC Booster]: Clique para enviar no discord">Enviar no Discord</button>`
                );
                document.getElementById( 'botaoDiscordNoDOM' ).addEventListener( 'click', async function () {
                  await sendMatchInfo( result.webhookLink, listenGame.data.data );
                } );
                if ( result.enviarPartida ) {
                  await sendMatchInfo( result.webhookLink, listenGame.data.data );
                }
              }
            }
          }
        }
      }, 3000 );
    }
  } );
};
