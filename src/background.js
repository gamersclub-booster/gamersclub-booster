// Background Service Worker (MV3)
// Gerencia o documento offscreen para reprodução de áudio sem restrição de autoplay
// Resolve o problema "[SOUND] Falha ao tocar o áudio NotAllowedError: play() failed because the user didn't interact with the document first."

const OFFSCREEN_URL = chrome.runtime.getURL( 'offscreen/offscreen.html' );

async function ensureOffscreenDocument() {
  const existingContexts = await chrome.runtime.getContexts( {
    contextTypes: [ 'OFFSCREEN_DOCUMENT' ],
    documentUrls: [ OFFSCREEN_URL ]
  } );
  if ( existingContexts.length > 0 ) { return; }

  await chrome.offscreen.createDocument( {
    url: OFFSCREEN_URL,
    reasons: [ 'AUDIO_PLAYBACK' ],
    justification: 'Reprodução do som de aviso do warmup sem restrição de autoplay'
  } );
}

chrome.runtime.onMessage.addListener( ( message, _sender, sendResponse ) => {
  if ( message.type !== 'play-warmup-sound' ) { return false; }

  ensureOffscreenDocument()
    .then( () => chrome.runtime.sendMessage( message ) )
    .then( () => sendResponse( { ok: true } ) )
    .catch( err => sendResponse( { ok: false, error: err?.message } ) );

  return true; // mantém o canal aberto para resposta assíncrona
} );
