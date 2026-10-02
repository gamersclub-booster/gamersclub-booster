const scriptsToInject = [ 'events-listener.js' ];
import { isExtensionContextValid } from '../../utils';

export default function injectPageScripts() {
  if ( !isExtensionContextValid() ) {
    return;
  }

  scriptsToInject.forEach( script => {
    try {
      if ( typeof chrome === 'undefined' || !chrome.runtime?.id ) {
        return;
      }
      const scriptPath = chrome.runtime.getURL( `/${ script }` );
      const scriptEl = document.createElement( 'script' );
      scriptEl.src = scriptPath;
      document.body.appendChild( scriptEl );
    } catch {
      // Context invalidated
    }
  } );
}

