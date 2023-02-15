import { sendMatchInfo } from '../../lib/discord';
import { GC_URL } from '../../lib/constants';
import axios from 'axios';

export const buildTimer = (targetContainer, timeleft, maxtime = 300) => {
  const time_util = (input) => `${Math.floor(input / 60) > 0 ? `${Math.floor(input / 60)}min ` : ""}${Math.floor(input % 60)}s`
  var warmup_finished = "O aquecimento já chegou ao fim!"
  var endTime = Math.floor(Date.now() / 1000) + timeleft
  var baseContent = `<div id="warmup_left">${time_util(timeleft)}</div><progress id="warmup_progressbar" value="${timeleft}" max="${maxtime}"></progress></div>`
  if (timeleft == 0) baseContent = warmup_finished
  targetContainer.append(`<div id="warmup_timer">${baseContent}</div>`);
  var x = setInterval(function () {
    var distance = endTime - Math.floor(Date.now() / 1000)
    // Display the result in the element with id="demo"
    $("#warmup_progressbar").attr('value', distance)
    $("#warmup_left").html(time_util(distance))

    // If the count down is finished, write some text
    if (distance < 0) {
      clearInterval(x);
      $("#warmup_timer").html(warmup_finished)
    }
  }, 1000);
  return x
}

export const partidaInfo = async () => {
  chrome.storage.sync.get(['webhookLink', 'enviarPartida', 'warmup_timer'], function (result) {
    const needDisc = result.webhookLink && result.webhookLink.length > 0
    const needWarmup = result.warmup_timer
    if (needDisc || needWarmup) {
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
              if (needWarmup && !warmupElement) {
                buildTimer(parentDisclaimer, listenGame.data.data.warmupExpiresInSeconds)
              }
            }
          }
        }
      }, 3000);
    }
  });
};
