import { sendMatchInfo } from '../../lib/discord';
import { GC_URL } from '../../lib/constants';
import axios from 'axios';
import { getAllStorageSyncData, getTranslationText } from '../../utils';

const colors = [
  {val: 300, color: "chartreuse"},
  {val: 120, color: "greenyellow"},
  {val: 60, color: "yellow"},
  {val: 30, color: "orange"},
  {val: 0, color: "orangered"},
]
const getColor = (arg_val) => {
  return (colors.find(({val}) => (arg_val > val)) || colors[0]).color
}


export const buildTimer = (warmup_finished, targetContainer, timeleft, maxtime = 300) => {

  const time_util = (input) => `${Math.floor(input / 60) > 0 ? `${Math.floor(input / 60)}min ` : ""}${Math.floor(input % 60)}s`

  var endTime = Math.floor(Date.now() / 1000) + timeleft
  var baseContent = `<div id="warmup_left_wrapper">Warmup: <b style="color: ${getColor(timeleft)}">${time_util(timeleft)}</b></div><progress style="accent-color: ${getColor(timeleft)}" id="warmup_progressbar" value="${timeleft}" max="${maxtime}"></progress></div>`
  if (timeleft == 0) baseContent = warmup_finished
  targetContainer.append(`<div id="warmup_timer">${baseContent}</div>`);
  var x = setInterval(function () {
    var distance = endTime - Math.floor(Date.now() / 1000)
    // Display the result in the element with id="demo"
    $("#warmup_progressbar").attr('value', distance)
    $("#warmup_left_wrapper > b").html(time_util(distance))
    $("#warmup_left_wrapper > b").css('color', getColor(distance)) 
    $("#warmup_progressbar").css('accent-color', getColor(distance)) 

    // If the count down is finished, write some text
    if (distance < 0) {
      clearInterval(x);
      $("#warmup_left_wrapper").html(warmup_finished)
    }
  }, 1000);
  return x
}
 
export const partidaInfo = async () => {
  const { traducao } = await getAllStorageSyncData();
  const warmup_finished = getTranslationText( 'warmup-fim', traducao );

  chrome.storage.sync.get(['webhookLink', 'enviarPartida', 'warmupTimer'], function (result) {
    const needDisc = result.webhookLink && result.webhookLink.length > 0
    const needWarmup = result.warmupTimer
    if (needDisc || needWarmup) {
      console.log(needDisc, needWarmup)
      setInterval(async () => {
        const selector = '.Disclaimer-sc-1ylcea4-5';
        const disclaimerInput = $(selector);
        const discElement = document.getElementById('botaoDiscordNoDOM')
        const warmupElement = document.getElementById('warmup_timer')

        if (disclaimerInput) {
          const parentDisclaimer = $('.Container-sc-1ylcea4-0').parent()
          if (needDisc && !discElement || needWarmup && !warmupElement) {
            const listenGame = await axios.get(`https://${GC_URL}/api/lobby/match`);
            if (listenGame?.data?.data?.step === 'onServerReady') {
              
              if (needWarmup && !warmupElement) {
                buildTimer(warmup_finished, parentDisclaimer, listenGame.data.data.warmupExpiresInSeconds + 30)
              }
              if (needDisc && !discElement) {
                parentDisclaimer.append(
                  `<button id="botaoDiscordNoDOM" class="WasdButton WasdButton--success WasdButton--lg botaoDiscordNoDOM-sc-1ylcea4-4"
                  data-tip-text="Clique para enviar no discord">Enviar no Discord</button>`
                );
                document.getElementById('botaoDiscordNoDOM').addEventListener('click', async function () {
                  await sendMatchInfo(result.webhookLink, listenGame.data.data);
                });
                if (result.enviarPartida) {
                  await sendMatchInfo(result.webhookLink, listenGame.data.data);
                }
              }
            }
          }
        }
      }, 3000);
    }
  });
};
