export const somReady = mutations =>
  chrome.storage.sync.get( [ 'somReady', 'customSomReady', 'volume' ], function ( result ) {
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

export function somReadySetInterval() {
  const interval = setInterval( async () => {
    chrome.storage.sync.get( [ 'somReady', 'customSomReady', 'volume' ], function ( result ) {
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
  }, 150 );
}

export const tocarSomSeVoceForExpulsoDaLobby = mutations => {
  chrome.storage.sync.get( [ 'somKicked', 'customSomKicked', 'volume' ], function ( result ) {
    const som = result.somKicked === 'custom' ? result.customSomKicked : result.somKicked;
    if ( gcToastExists( mutations ) ) {
      const audio = new Audio( som );
      const volume = Number( result.volume ?? 100 );
      audio.volume = volume / 100;
      audio.play();
    }
  } );
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
