export const tocarSomSeVoceForExpulsoDaLobby = mutations => {
  chrome.storage.sync.get( [ 'somKicked', 'customSomKicked', 'volume' ], function ( result ) {
    const som = result.somKicked === 'custom' ? result.customSomKicked : result.somKicked;
    if ( gcToastExists( mutations ) ) {
      const audio = new Audio( som );
      const volume = result.volume || 100;
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

