chrome.runtime.onMessage.addListener( ( request, sender, sendResponse ) => {
  if ( request.action === 'fetchSteam' ) {
    fetch( request.url )
      .then( response => response.json() )
      .then( data => sendResponse( { success: true, data } ) )
      .catch( error => sendResponse( { success: false, error: error.message } ) );
    return true; // Keep message channel open for asynchronous response
  }
} );
