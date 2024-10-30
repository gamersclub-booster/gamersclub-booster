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
          const volume = result.volume || 100;
          audio.volume = volume / 100;
          $( selector ).on( 'click', function () { audio.play(); } );
        }
      } );
    }
  } );

export function somReadySetInterval() {
  setInterval( async () => {
    chrome.storage.sync.get( [ 'somReady', 'customSomReady', 'volume' ], function ( result ) {
      if ( result.somReady ) {
        // eslint-disable-next-line
        const readyButton = $( "button:contains('Ready')" );
        if ( readyButton && readyButton.length && !readyButton.disabled ) {
          const som = result.somReady === 'custom' ? result.customSomReady : result.somReady;
          const audio = new Audio( som );
          const volume = result.volume || 100;
          audio.volume = volume / 100;
          $( readyButton ).on( 'click', function () { audio.play(); } );
        }
      }
    } );
  }, 150 );
}
