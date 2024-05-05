export const somReady = mutations =>
  chrome.storage.sync.get( [ 'somReady', 'customSomReady', 'volume' ], function ( result ) {
    if ( result.somReady ) {
      $.each( mutations, ( _i, mutation ) => {
        const addedNodes = $( mutation.addedNodes );
        const selector = 'button:contains(\'Ready\')';
        const readyButton = addedNodes.find( selector ).addBack( selector );
        if ( readyButton && readyButton.length && readyButton.text() === 'Ready' && !readyButton.disabled ) {
          const som = result.somReady === 'custom' ? result.customSomReady : result.somReady;
          const audio = new Audio( som );
          const volume = result.volume || 100;
          audio.volume = volume / 100;
          $( selector ).on( 'click', function () { audio.play(); } );
        }
      } );
    }
  } );
