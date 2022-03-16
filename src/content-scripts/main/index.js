import { adicionarBarraLevel } from './barraLevel';
import { coletarDailyRewards } from './autoDailyRewards';

let generalOptions = [];
chrome.storage.sync.get( null, function ( result ) {
  generalOptions = result;
  initGcBooster();
} );

const initGcBooster = async () => {
  if ( generalOptions.mostrarLevelProgress ) {
    adicionarBarraLevel();
  }

  if ( generalOptions.autoDailyRewards ) {
    const { lastCollectedDailyRewardsTs } = generalOptions;
    const currentTimestamp = Date.now();
    const dayInMilliseconds = 86400000;


    // coletar daily rewards se ele não foi coletado
    // nenhuma vez ou se a última coleta faz mais de um dia
    if ( !lastCollectedDailyRewardsTs ||
        ( currentTimestamp - lastCollectedDailyRewardsTs >= dayInMilliseconds ) ) {
      coletarDailyRewards();
    }
  }
};
