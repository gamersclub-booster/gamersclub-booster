import { isExtensionContextValid } from '../../utils';

export const autoConcordarTermosRanked = mutations => {
  if ( !isExtensionContextValid() ) { return; }
  try {
    chrome.storage.sync.get( [ 'autoConcordarTermosRanked' ], function ( result ) {
      if ( chrome.runtime?.lastError || !result ) { return; }
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
  } catch ( _e ) {
    // Context invalidated
  }
};
