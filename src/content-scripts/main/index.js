import { adicionarBarraLevel } from './barraLevel';

let generalOptions = [];
chrome.storage.sync.get( null, function ( result ) {
  generalOptions = result;
  initGcBooster();
} );

const initGcBooster = async () => {
  if ( generalOptions.mostrarLevelProgress ) {
    adicionarBarraLevel();
  }
};
