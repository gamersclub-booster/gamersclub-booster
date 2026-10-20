import { getFromStorage, setStorage } from './storage';

const RESOLVER_CACHE_KEY = 'gc_steam_resolver_cache';
const htmlCache = new Map();
const pendingHtmlRequests = new Map();

// Fila com controle de concorrência e pausa entre requisições
// Evita "Too Many Requests" (HTTP 429) e bloqueios na Gamers Club
const MAX_CONCURRENT_REQUESTS = 2;
const REQUEST_COOLDOWN_MS = 150;

let activeRequests = 0;
const requestQueue = [];

const processQueue = () => {
  while ( activeRequests < MAX_CONCURRENT_REQUESTS && requestQueue.length > 0 ) {
    activeRequests++;
    const { fn, resolve, reject } = requestQueue.shift();

    fn()
      .then( resolve )
      .catch( reject )
      .finally( () => {
        activeRequests--;
        setTimeout( processQueue, REQUEST_COOLDOWN_MS );
      } );
  }
};

const enqueueRequest = fn => new Promise( ( resolve, reject ) => {
  requestQueue.push( { fn, resolve, reject } );
  processQueue();
} );

/**
 * Busca o HTML da página de perfil do jogador na Gamers Club com:
 * 1. Cache em memória para evitar múltiplas requisições ao mesmo perfil
 * 2. Deduplicação de requisições simultâneas em andamento
 * 3. Fila assíncrona com concorrência limitada (máx 2) e delay (150ms)
 * 4. Timeout seguro via AbortController (8 segundos)
 * 5. Pré-extração de SteamID para abastecer o cache de auditoria
 */
export async function fetchPlayerProfileHtml( gcPlayerId ) {
  if ( !gcPlayerId ) { return null; }
  const idStr = String( gcPlayerId );

  if ( htmlCache.has( idStr ) ) {
    return htmlCache.get( idStr );
  }

  if ( pendingHtmlRequests.has( idStr ) ) {
    return pendingHtmlRequests.get( idStr );
  }

  // Registra a promise ANTES de iniciar qualquer operação async
  // para garantir que chamadores simultâneos peguem a mesma promise
  const fetchPromise = enqueueRequest( async () => {
    let controller = null;
    let timeoutId = null;

    try {
      const url = `https://gamersclub.com.br/player/${idStr}`;

      if ( typeof AbortController !== 'undefined' ) {
        controller = new AbortController();
        timeoutId = setTimeout( () => {
          try {
            controller.abort();
          } catch ( _e ) {
            // Ignora se já concluído
          }
        }, 8000 );
      }

      const response = await fetch( url, {
        credentials: 'same-origin',
        signal: controller ? controller.signal : undefined
      } );

      if ( timeoutId ) { clearTimeout( timeoutId ); }

      if ( !response || !response.ok ) {
        return null;
      }

      const html = await response.text();
      // Threshold reduzido para não rejeitar páginas com pouco conteúdo mas ainda válidas
      if ( !html || html.length < 200 ) {
        return null;
      }

      htmlCache.set( idStr, html );
      // Mantém em memória por 5 minutos
      setTimeout( () => htmlCache.delete( idStr ), 5 * 60 * 1000 );

      // Se encontrou URL da Steam no HTML, já alimenta o cache de resolução de SteamID
      const steamMatch = html.match(
        /https?:\/\/(?:www\.)?steamcommunity\.com\/(profiles\/(\d{17})|id\/([a-zA-Z0-9_-]+))/i
      );
      if ( steamMatch ) {
        const fullUrl = steamMatch[0];
        const steamIdDirect = steamMatch[2];
        if ( steamIdDirect ) {
          try {
            const cache = await getFromStorage( RESOLVER_CACHE_KEY ) || {};
            if ( !cache[idStr]?.steamId ) {
              cache[idStr] = {
                steamId: steamIdDirect,
                rawSteamUrl: fullUrl,
                csrepUrl: `https://csrep.gg/player/${steamIdDirect}`
              };
              await setStorage( RESOLVER_CACHE_KEY, cache );
            }
          } catch ( _e ) {
            // Falha silenciosa ao gravar cache
          }
        }
      }

      return html;
    } catch ( _err ) {
      if ( timeoutId ) { clearTimeout( timeoutId ); }
      return null;
    }
  } );

  // Registra como pendente e remove após resolução (independente de sucesso ou erro)
  pendingHtmlRequests.set( idStr, fetchPromise );
  fetchPromise.finally( () => pendingHtmlRequests.delete( idStr ) );

  return fetchPromise;
}
