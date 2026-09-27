import { isExtensionContextValid } from '../../utils';

export const autoMostrarIp = () => {
  if ( !isExtensionContextValid() ) { return; }
  try {
    chrome.storage.sync.get( [ 'autoMostrarIp' ], function ( result ) {
      if ( chrome.runtime?.lastError || !result ) { return; }
      if ( result.autoMostrarIp ) {
        const interval = setInterval( () => {
          if ( !isExtensionContextValid() ) {
            clearInterval( interval );
            return;
          }
          const selector = '[class*="ServerDataContainer"]';
          const serverData = $.find( selector );

          if ( serverData && serverData.length ) {
            serverData[0].style.display = 'flex';
            clearInterval( interval );
          }
        }, 3000 );
      }
    } );
  } catch ( _e ) {
    // Context invalidated
  }
};
