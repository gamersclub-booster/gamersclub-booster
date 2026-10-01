import { getFromStorage, setStorage } from '../../lib/storage';
import { GC_URL } from '../../lib/constants';
import { fetchPlayerProfileHtml } from '../../lib/profileFetcher';

const SELETOR_DATA_CRIACAO = '.gc-list-title';
const DOIS_DIAS = ( 2 * 24 * 60 * 60 * 1000 );
const CINCO_MINUTOS = ( 5 * 60 * 1000 );

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
  // Dados marcados como parciais são ignorados para forçar nova busca quando o TTL curto vencer
  if ( memoryPlayerInfoCache.has( idStr ) ) {
    const cachedMem = memoryPlayerInfoCache.get( idStr );
    if ( cachedMem.ttl > Date.now() && !cachedMem.isPartialData ) {
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

  // Só considera cache válido se possuir informações reais E não for dado parcial/fictício
  const hasValidData = cachedStorage &&
    ( cachedStorage.dataCriacao !== '-' || cachedStorage.totalPartidas > 0 || cachedStorage.kdr !== null );

  // Se os dados estão no cache mas foram marcados como parciais (fictícios/fallback),
  // só retorna se o TTL curto ainda não venceu — caso contrário, tenta re-buscar
  const isPartialCached = cachedStorage?.isPartialData === true;

  if ( hasValidData && cachedStorage.ttl > Date.now() && !isPartialCached ) {
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

      // --- Data de criação ---
      // Tentativa 1: elemento com label "registrado em"
      const dataCriacaoElement = $html.find( SELETOR_DATA_CRIACAO ).filter( function () {
        const text = $( this ).text().trim().toLowerCase();
        return /(registrado\s*(em|el)|registered\s*in)/i.test( text );
      } ).first();
      dataCriacao = dataCriacaoElement.next().text().trim();

      // Tentativa 2: irmão de qualquer elemento com label de registro
      if ( !dataCriacao || dataCriacao === '-' ) {
        $html.find( '[class*="list-title"], [class*="ListTitle"], dt, th, label' ).each( function () {
          if ( dataCriacao && dataCriacao !== '-' ) { return false; }
          const text = $( this ).text().trim().toLowerCase();
          if ( /(registrado|registered)/i.test( text ) ) {
            const next = $( this ).next().text().trim();
            if ( next && next.length > 2 ) { dataCriacao = next; }
          }
        } );
      }

      // Tentativa 3: regex no HTML bruto
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
      let foundStats = false;

      // 1. Tenta pegar do histórico CS2
      const cs2Tab = $html.find( '#cs2-history-list' ).first();
      if ( cs2Tab.length > 0 ) {
        cs2Tab.find( '.gc-card-history-text' ).each( function () {
          const text = $( this ).clone().children().remove().end().text().trim();
          const qtd = parseInt( text.replace( /\D/g, '' ), 10 );
          if ( !isNaN( qtd ) && qtd > 0 ) { totalPartidas += qtd; foundStats = true; }
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
      }

      // 2. Se não tinha dados em CS2, tenta pegar do histórico CS:GO
      if ( !foundStats ) {
        const csgoTab = $html.find( '#csgo-history-list' ).first();
        if ( csgoTab.length > 0 ) {
          csgoTab.find( '.gc-card-history-text' ).each( function () {
            const text = $( this ).clone().children().remove().end().text().trim();
            const qtd = parseInt( text.replace( /\D/g, '' ), 10 );
            if ( !isNaN( qtd ) && qtd > 0 ) { totalPartidas += qtd; foundStats = true; }
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
      }

      // 3. Fallback genérico de partidas se nenhuma aba específica foi encontrada
      if ( !foundStats ) {
        $html.find( '[id*="history"], [class*="history-list"], [class*="HistoryList"]' ).first()
          .find( '[class*="history-text"], [class*="HistoryText"]' ).each( function () {
            const text = $( this ).clone().children().remove().end().text().trim();
            const qtd = parseInt( text.replace( /\D/g, '' ), 10 );
            if ( !isNaN( qtd ) && qtd > 0 ) { totalPartidas += qtd; }
          } );
      }

      // --- Win rate ---
      const totalJogos = totalVitorias + totalDerrotas;
      if ( totalJogos > 0 ) {
        porcentagemVitoria = ( ( totalVitorias / totalJogos ) * 100 ).toFixed( 2 );
      } else if ( totalPartidas > 0 ) {
        // Tenta extrair win rate direto do HTML (alguns perfis exibem %)
        const wrMatch = html.match( /(?:win\s*rate|taxa\s*de\s*vit[óo]ria)[^\d]*(\d+(?:[.,]\d+)?)\s*%/i );
        if ( wrMatch ) {
          porcentagemVitoria = parseFloat( wrMatch[1].replace( ',', '.' ) ).toFixed( 2 );
        }
      }

      anotacao = getAnotacao( html );

      // --- KDR ---
      const kdrMatch = html.match( /KDR[:\s]+(\d+(?:\.\d+)?)/i );
      if ( kdrMatch && kdrMatch[1] ) {
        kdr = kdrMatch[1];
      }

      // Fallback KDR por elemento
      if ( !kdr ) {
        $html.find( '[class*="kdr"], [class*="KDR"], [data-stat="KDR"]' ).each( function () {
          if ( kdr ) { return false; }
          const txt = $( this ).text().replace( /[^\d.]/g, '' );
          if ( txt && !isNaN( parseFloat( txt ) ) ) { kdr = txt; }
        } );
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

  // 5. Fallback adicional para KDR: kdrCache local ou endpoint de histórico da GC
  if ( !kdr ) {
    try {
      const kdrCache = await getFromStorage( 'kdrCache' ) || {};
      if ( kdrCache[idStr]?.kdr ) {
        kdr = String( kdrCache[idStr].kdr );
      }
    } catch ( _e ) {
      // Silencioso
    }
  }

  if ( !kdr ) {
    try {
      const gcHost = GC_URL || window.location.hostname || 'gamersclub.com.br';
      const res = await fetch( `https://${gcHost}/api/box/history/${idStr}`, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin'
      } );
      if ( res.ok ) {
        const boxData = await res.json();
        const boxKdr = boxData?.stat?.[0]?.value;
        if ( boxKdr ) {
          kdr = String( boxKdr );
        }
      }
    } catch ( _e ) {
      // Silencioso
    }
  }

  // Determina se os dados obtidos são parciais/fictícios (nenhuma informação real)
  const hasRealData = dataCriacao !== '-' || totalPartidas > 0 || kdr !== null;

  const response = {
    dataCriacao: dataCriacao || '-',
    totalPartidas: totalPartidas || 0,
    porcentagemVitoria: porcentagemVitoria || '0.00',
    anotacao: anotacao || 'Nenhuma',
    kdr: kdr || null,
    isPartialData: !hasRealData,
    ttl: hasRealData ? Date.now() + DOIS_DIAS : Date.now() + CINCO_MINUTOS
  };

  if ( hasRealData ) {
    // Dados reais: persiste no storage por 2 dias
    memoryPlayerInfoCache.set( idStr, response );
    try {
      const currentCache = await getFromStorage( 'lupaCache' ) || {};
      currentCache[idStr] = response;
      await setStorage( 'lupaCache', currentCache );
    } catch ( _e ) {
      // Silencioso
    }
  } else {
    // Dados parciais: apenas memória por 5 min para não repetir request na mesma sessão
    // Não grava no storage — próxima sessão/aba sempre tenta de novo
    memoryPlayerInfoCache.set( idStr, response );
  }

  return response;
}
