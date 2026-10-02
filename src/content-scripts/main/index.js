import { autoCompactMode } from './autoCompactMode';
import { autoDarkMode } from './autoDarkMode';
import { adicionarBarraLevel } from './barraLevel';
import injectPageScripts from './injectPageScripts';
import { isExtensionContextValid } from '../../utils';

let generalOptions = [];

const initGcBooster = async () => {
  // injeta os scripts no contexto da página para ter acesso às variáveis globais
  injectPageScripts();

  if ( generalOptions.mostrarLevelProgress ) {
    adicionarBarraLevel();
  }

  if ( generalOptions.autoDarkMode ) {
    autoDarkMode();
  }
  if ( generalOptions.autoCompactMode ) {
    autoCompactMode();
  }
};

if ( isExtensionContextValid() ) {
  try {
    chrome.storage.sync.get( null, function ( result ) {
      if ( !isExtensionContextValid() || chrome.runtime?.lastError || !result ) {
        return;
      }
      generalOptions = result;
      initGcBooster();
    } );
  } catch {
    // Context invalidated
  }
}

