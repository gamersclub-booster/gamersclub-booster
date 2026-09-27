import { auditPlayersDirect, invalidateCache } from '../lib/playerAudit';

chrome.runtime.onMessage.addListener( ( request, sender, sendResponse ) => {
  if ( request.action === 'AUDIT_PLAYERS' ) {
    auditPlayersDirect( request.gcPlayerIds )
      .then( data => sendResponse( { success: true, data } ) )
      .catch( error => {
        console.error( '[GC Booster Background] Erro em AUDIT_PLAYERS:', error );
        sendResponse( { success: false, error: error?.message || 'Unknown error' } );
      } );
    return true; // Mantém a conexão aberta para resposta assíncrona
  }

  if ( request.action === 'INVALIDATE_AUDIT_CACHE' ) {
    invalidateCache( request.steamIds )
      .then( () => sendResponse( { success: true } ) )
      .catch( error => {
        console.error( '[GC Booster Background] Erro em INVALIDATE_AUDIT_CACHE:', error );
        sendResponse( { success: false, error: error?.message || 'Unknown error' } );
      } );
    return true;
  }
} );
