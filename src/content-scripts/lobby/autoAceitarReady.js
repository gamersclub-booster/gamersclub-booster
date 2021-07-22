export const autoAceitarReady = mutations =>
  chrome.storage.sync.get( [ 'autoAceitarReady' ], function ( result ) {
    if ( result.autoAceitarReady ) {
      $.each( mutations, ( i, mutation ) => {
        const addedNodes = $( mutation.addedNodes );
        //eslint-disable-next-line
          const selector = "button:contains('Ready')";
        const readyButton = addedNodes.find( selector ).addBack( selector );
        if ( readyButton && readyButton.length && !readyButton.disabled ) {
          setTimeout( () => {
            readyButton[0].click();
            readyButton[0].trigger( 'click' );
          }, 150 );
        }
      } );
    }
  } );

export function autoAceitarReadySetInterval() {
  setInterval( async () => {
    chrome.storage.sync.get( [ 'autoAceitarReady' ], function ( result ) {
      if ( result.autoAceitarReady ) {
        // eslint-disable-next-line
        const readyButton = $( "button:contains('Ready')" );
        if ( readyButton.length ) {
          setTimeout( () => {
            readyButton[0].click();
            readyButton[0].trigger( 'click' );
          }, 150 );
        }
      }
    } );
  }, 300 );
}
