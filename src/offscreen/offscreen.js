// Offscreen document: recebe mensagens do background e reproduz áudio
chrome.runtime.onMessage.addListener( message => {
  if ( message.type !== 'play-warmup-sound' ) { return; }

  const { src, volume } = message;
  const audio = new Audio( src );
  audio.volume = Math.min( 1, Math.max( 0, volume ) );
  audio.play().catch( () => {} );
} );
