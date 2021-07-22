export const autoConcordarTermosRanked = mutations =>
  chrome.storage.sync.get( [ 'autoConcordarTermosRanked' ], function ( result ) {
    if ( result.autoConcordarTermosRanked ) {
      $.each( mutations, ( i, mutation ) => {
        const addedNodes = $( mutation.addedNodes );
        const selector = '.RankedRules__button';
        const concordarButton = addedNodes.find( selector ).addBack( selector );
        if ( concordarButton && concordarButton.length ) {
          concordarButton[0].click();
        }
      } );
    }
  } );
