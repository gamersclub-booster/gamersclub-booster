export const ocultarSugestaoDeLobbies = () =>
  chrome.storage.sync.get( [ 'ocultarSugestaoDeLobbies' ], function ( result ) {
    if ( result.ocultarSugestaoDeLobbies ) {
      document.body.classList.add( 'ocultar-sugestao-de-lobbies' );
    }
  } );
