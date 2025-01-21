export const autoMostrarIp = () => {
  chrome.storage.sync.get( [ 'autoMostrarIp' ], function ( result ) {
    if ( result.autoMostrarIp ) {
      const interval = setInterval( () => {
        const selector = '[class*="ServerDataContainer"]' ;
        const serverData = $.find( selector );

        if ( serverData && serverData.length ) {
          serverData[0].style.display = 'flex';
          clearInterval( interval );
        }
      }, 3000 );
    }
  } );
};
