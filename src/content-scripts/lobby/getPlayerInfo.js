import { getFromStorage, setStorage } from '../../lib/storage';
import { GC_URL } from '../../lib/constants';
import { fetchPlayerProfileHtml } from '../../lib/profileFetcher';

const SELETOR_DATA_CRIACAO = '.gc-list-title';
const DOIS_DIAS = ( 2 * 24 * 60 * 60 * 1000 );

const memoryPlayerInfoCache = new Map();

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
  if ( !html ) { return 'Nenhuma'; }
  if ( html.includes( 'gc-button-notes-negative' ) || $( html ).find( '.gc-button-notes-negative' )[0] ) {
    return 'Negativa';
  }
  if ( html.includes( 'gc-button-notes-positive' ) || $( html ).find( '.gc-button-notes-positive' )[0] ) {
    return 'Positiva';
  }
  return 'Nenhuma';
};

const DEFAULT_PLAYER_INFO = {
  dataCriacao: '-',
  totalPartidas: 0,
  porcentagemVitoria: '0.00',
  anotacao: 'Nenhuma',
  kdr: null
};

const fetchPlayerCardApiFallback = async id => {
  try {
    const gcHost = GC_URL || window.location.hostname || 'gamersclub.com.br';
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeout = controller ? setTimeout( () => controller.abort(), 4000 ) : null;

    const res = await fetch( `https://${gcHost}/api/player-card/${id}`, {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
      signal: controller ? controller.signal : undefined
    } );

    if ( timeout ) { clearTimeout( timeout ); }
    if ( !res.ok ) { return null; }

    const data = await res.json();
    return data;
  } catch ( _e ) {
    return null;
  }
};

export async function getPlayerInfo( id ) {
  if ( !id || !/^\d+$/.test( String( id ) ) ) {
    return { ...DEFAULT_PLAYER_INFO };
  }

  const idStr = String( id );

  // 1. Memória rápida (0ms)
  if ( memoryPlayerInfoCache.has( idStr ) ) {
    const cachedMem = memoryPlayerInfoCache.get( idStr );
    if ( cachedMem.ttl > Date.now() ) {
      return cachedMem;
    }
  }

  // 2. Storage local
  const ultimaLimpezaCache = await getFromStorage( 'ultimaLimpezaCache' );
  if ( !ultimaLimpezaCache || ultimaLimpezaCache < Date.now() - DOIS_DIAS ) {
    await limparCache();
  }
  const lupaCache = await getFromStorage( 'lupaCache' ) || {};
  const cachedStorage = lupaCache?.[idStr];

  // Só considera cache válido se possuir informações reais
  const hasValidData = cachedStorage &&
    ( cachedStorage.dataCriacao !== '-' || cachedStorage.totalPartidas > 0 || cachedStorage.kdr !== null );

  if ( hasValidData && cachedStorage.ttl > Date.now() ) {
    memoryPlayerInfoCache.set( idStr, cachedStorage );
    return cachedStorage;
  }

  // 3. Buscar dados via HTML compartilhado (com deduplicação e cache)
  let dataCriacao = '-';
  let totalPartidas = 0;
  let porcentagemVitoria = '0.00';
  let anotacao = 'Nenhuma';
  let kdr = null;

  const html = await fetchPlayerProfileHtml( idStr );

  if ( html ) {
    try {
      const $html = $( html );

      const dataCriacaoElement = $html.find( SELETOR_DATA_CRIACAO ).filter( function () {
        const text = $( this ).text().trim().toLowerCase();
        return /(registrado\s*(em|el)|registered\s*in)/i.test( text );
      } ).first();

      dataCriacao = dataCriacaoElement.next().text().trim();

      // Fallback regex se elemento não foi encontrado
      if ( !dataCriacao || dataCriacao === '-' ) {
        const matchDate = html.match(
          /(?:registrado|registered)\s*(?:em|in|el)?[:\s]*(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})/i
        );
        if ( matchDate ) {
          dataCriacao = matchDate[1];
        }
      }

      let totalVitorias = 0;
      let totalDerrotas = 0;

      // 1. Tenta pegar do histórico CS2
      const cs2Tab = $html.find( '#cs2-history-list' ).first();
      cs2Tab.find( '.gc-card-history-text' ).each( function () {
        const text = $( this ).clone().children().remove().end().text().trim();
        const qtd = parseInt( text.replace( /\D/g, '' ), 10 );
        if ( !isNaN( qtd ) ) { totalPartidas += qtd; }
      } );

      cs2Tab.find( '.gc-card-history-detail span' ).each( function () {
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

      // 2. Se não tinha dados em CS2, tenta pegar do histórico CS:GO
      if ( totalPartidas === 0 ) {
        const csgoTab = $html.find( '#csgo-history-list' ).first();
        csgoTab.find( '.gc-card-history-text' ).each( function () {
          const text = $( this ).clone().children().remove().end().text().trim();
          const qtd = parseInt( text.replace( /\D/g, '' ), 10 );
          if ( !isNaN( qtd ) ) { totalPartidas += qtd; }
        } );
        csgoTab.find( '.gc-card-history-detail span' ).each( function () {
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
      }

      const totalJogos = totalVitorias + totalDerrotas;
      if ( totalJogos > 0 ) {
        porcentagemVitoria = ( ( totalVitorias / totalJogos ) * 100 ).toFixed( 2 );
      }

      anotacao = getAnotacao( html );

      // Tenta extrair KDR do HTML se disponível
      const kdrMatch = html.match( /KDR[:\s]+(\d+(?:\.\d+)?)/i );
      if ( kdrMatch && kdrMatch[1] ) {
        kdr = kdrMatch[1];
      }
    } catch ( _err ) {
      // Ignora erro no parse do HTML
    }
  }

  // 4. Se não conseguiu partidas ou KDR via HTML, consulta API player-card de forma rápida
  if ( totalPartidas === 0 || !kdr ) {
    const apiData = await fetchPlayerCardApiFallback( idStr );
    if ( apiData ) {
      const monthMatches = apiData?.currentMonthMatchesHistory?.matches || 0;
      const monthWins = apiData?.currentMonthMatchesHistory?.wins || 0;

      if ( totalPartidas === 0 && monthMatches > 0 ) {
        totalPartidas = monthMatches;
        porcentagemVitoria = ( ( monthWins / monthMatches ) * 100 ).toFixed( 2 );
      }

      if ( !kdr ) {
        const kdrStat = apiData?.stats?.find( s => s.stat === 'KDR' );
        if ( kdrStat?.value ) {
          kdr = String( kdrStat.value );
        }
      }
    }
  }

  const response = {
    dataCriacao: dataCriacao || '-',
    totalPartidas: totalPartidas || 0,
    porcentagemVitoria: porcentagemVitoria || '0.00',
    anotacao: anotacao || 'Nenhuma',
    kdr: kdr || null,
    ttl: Date.now() + DOIS_DIAS
  };

  // Salva no cache apenas se obteve alguma informação válida para não persistir falhas
  if ( response.dataCriacao !== '-' || response.totalPartidas > 0 || response.kdr !== null ) {
    memoryPlayerInfoCache.set( idStr, response );
    try {
      const currentCache = await getFromStorage( 'lupaCache' ) || {};
      currentCache[idStr] = response;
      await setStorage( 'lupaCache', currentCache );
    } catch ( _e ) {
      // Silencioso
    }
  }

  return response;
}
