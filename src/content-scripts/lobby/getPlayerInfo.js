import { getFromStorage, setStorage } from '../../lib/storage';
import { GC_URL } from '../../lib/constants';

const BASE_URL = `https://${GC_URL}/player`;

const SELETOR_DATA_CRIACAO = '.gc-list-title';

const DOIS_DIAS = ( 2 * 24 * 60 * 60 * 1000 );

// Limpa o cache a cada 2 dias se o TTL for menor q 'agora'
const limparCache = async () => {
  const cache = await getFromStorage( 'lupaCache' ) || {};
  for ( const [ id, obj ] of Object.entries( cache ) ) {
    if ( obj.ttl <= Date.now() ) {
      delete cache[id];
    }
  }
  await setStorage( 'lupaCache', cache );
  await setStorage( 'ultimaLimpezaCache', Date.now() );
};

const getAnotacao = html => {
  const $html = $( html );
  if ( $html.find( '.gc-button-notes-negative, .PlayerAnnotations--negative, svg[stroke="#ff3b3b"], .note-negative' ).length ) {
    return 'Negativa';
  }
  if ( $html.find( '.gc-button-notes-positive' ).length ) {
    return 'Positiva';
  }
  return 'Nenhuma';
};

const requestQueue = [];
let isProcessingQueue = false;

const processQueue = async () => {
  if ( isProcessingQueue || requestQueue.length === 0 ) { return; }
  isProcessingQueue = true;

  while ( requestQueue.length > 0 ) {
    const task = requestQueue.shift();
    await fetchPlayerInfoTask( task.id, task.resolve, task.reject );
    // Delay de 1500ms entre as requisições para evitar rate limit (429)
    await new Promise( resolve => setTimeout( resolve, 1500 ) );
  }

  isProcessingQueue = false;
};

const fetchPlayerInfoTask = async ( id, resolve, reject ) => {
  try {
    const url = `${BASE_URL}/${id}`;

    await new Promise( ( res, rej ) => {
      $.get( url, async function ( html ) {
        try {
          const $html = $( html );

          const dataCriacaoElement = $html.find( SELETOR_DATA_CRIACAO ).filter( function () {
            const text = $( this ).text().trim().toLowerCase();
            return /(registrado\s*(em|el)|registered\s*in)/i.test( text );
          } ).first();

          const dataCriacao = dataCriacaoElement.next().text().trim();
          const firstTab = $html.find( '#cs2-history-list' ).first();

          let totalPartidas = 0;
          let totalVitorias = 0;
          let totalDerrotas = 0;

          firstTab.find( '.gc-card-history-text' ).each( function () {
            const text = $( this ).clone().children().remove().end().text().trim();
            const qtd = parseInt( text.replace( /\D/g, '' ), 10 );
            if ( !isNaN( qtd ) ) { totalPartidas += qtd; }
          } );

          firstTab.find( '.gc-card-history-detail span' ).each( function () {
            const txt = $( this ).text().trim().toLowerCase();

            if ( /vit[óo]ri(a|as)|victor(y|ies|ias)/i.test( txt ) ) {
              const qtd = parseInt( txt.replace( /\D/g, '' ), 10 );
              if ( !isNaN( qtd ) ) { totalVitorias += qtd; }
            }

            if ( /derrotas?|defeat(s)?/i.test( txt ) ) {
              const qtd = parseInt( txt.replace( /\D/g, '' ), 10 );
              if ( !isNaN( qtd ) ) { totalDerrotas += qtd; }
            }
          } );

          const totalJogos = totalVitorias + totalDerrotas;
          const porcentagemVitoria =
            totalJogos > 0 ? ( ( totalVitorias / totalJogos ) * 100 ).toFixed( 2 ) : '0.00';

          const anotacao = getAnotacao( html );

          const response = {
            dataCriacao,
            totalPartidas,
            porcentagemVitoria,
            anotacao,
            ttl: Date.now() + DOIS_DIAS
          };

          const lupaCache = await getFromStorage( 'lupaCache' ) || {};
          lupaCache[id] = response;
          await setStorage( 'lupaCache', lupaCache );
          resolve( response );
          res();
        } catch ( err ) {
          rej( err );
        }
      } ).fail( function ( jqXHR, textStatus, errorThrown ) {
        reject( new Error( `Failed to load player ${id}: ${textStatus} ${errorThrown}` ) );
        res(); // Resolve the inner promise so the queue continues even on failure
      } );
    } );
  } catch ( e ) {
    reject( e );
  }
};

export async function getPlayerInfo( id, bypassQueue = false ) {
  const ultimaLimpezaCache = await getFromStorage( 'ultimaLimpezaCache' );
  if ( !ultimaLimpezaCache || ultimaLimpezaCache < Date.now() - DOIS_DIAS ) {
    await limparCache();
  }
  const lupaCache = await getFromStorage( 'lupaCache' ) || {};
  if ( !bypassQueue && lupaCache?.[id]?.ttl > Date.now() ) {
    return lupaCache[id];
  }

  if ( bypassQueue ) {
    return new Promise( ( resolve, reject ) => {
      fetchPlayerInfoTask( id, resolve, reject );
    } );
  }

  return new Promise( ( resolve, reject ) => {
    requestQueue.push( { id, resolve, reject } );
    processQueue();
  } );
}
