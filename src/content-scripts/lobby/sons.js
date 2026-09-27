import { isExtensionContextValid } from '../../utils';

export const somReady = mutations => {
  if ( !isExtensionContextValid() ) { return; }
  try {
    chrome.storage.sync.get( [ 'somReady', 'customSomReady', 'volume' ], function ( result ) {
      if ( chrome.runtime?.lastError || !result ) { return; }
      if ( result.somReady ) {
        $.each( mutations, ( _i, mutation ) => {
          const addedNodes = $( mutation.addedNodes );
          //eslint-disable-next-line
          const selector = "button:contains('Ready')";
          const readyButton = addedNodes.find( selector ).addBack( selector );
          if ( readyButton && readyButton.length && !readyButton.disabled ) {
            const som = result.somReady === 'custom' ? result.customSomReady : result.somReady;
            const audio = new Audio( som );
            const volume = Number( result.volume ?? 100 );
            audio.volume = volume / 100;
            $( selector ).on( 'click', function () { audio.play(); } );
          }
        } );
      }
    } );
  } catch ( _e ) {
    // Context invalidated
  }
};

export function somReadySetInterval() {
  const interval = setInterval( async () => {
    if ( !isExtensionContextValid() ) {
      clearInterval( interval );
      return;
    }
    try {
      chrome.storage.sync.get( [ 'somReady', 'customSomReady', 'volume' ], function ( result ) {
        if ( chrome.runtime?.lastError || !result ) { return; }
        if ( result.somReady ) {
          // eslint-disable-next-line
          const readyButton = $( "button:contains('Ready')" );
          if ( readyButton && readyButton.length && !readyButton.disabled ) {
            const som = result.somReady === 'custom' ? result.customSomReady : result.somReady;
            const audio = new Audio( som );
            const volume = Number( result.volume ?? 100 );
            audio.volume = volume / 100;
            $( readyButton ).on( 'click', function () { audio.play(); } );
            clearInterval( interval );
          }
        }
      } );
    } catch ( _e ) {
      clearInterval( interval );
    }
  }, 150 );
}

export const tocarSomSeVoceForExpulsoDaLobby = mutations => {
  if ( !isExtensionContextValid() ) { return; }
  try {
    chrome.storage.sync.get( [ 'somKicked', 'customSomKicked', 'volume' ], function ( result ) {
      if ( chrome.runtime?.lastError || !result ) { return; }
      const som = result.somKicked === 'custom' ? result.customSomKicked : result.somKicked;
      if ( gcToastExists( mutations ) ) {
        const audio = new Audio( som );
        const volume = Number( result.volume ?? 100 );
        audio.volume = volume / 100;
        audio.play();
      }
    } );
  } catch ( _e ) {
    // Context invalidated
  }
};
function gcToastExists( mutations ) {
  for ( const mutation of mutations ) {
    for ( const node of mutation.addedNodes ) {
      if ( !node.classList ) {
        continue;
      }
      if ( node.innerText.toLowerCase().includes( 'kickado' ) ) {
        return true;
      }
    }
  }
  return false;
}
