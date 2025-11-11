import { getFromStorage, setStorage } from '../../lib/storage';
import { getOverallPlayerStats } from './getOverallPlayerStats';

const DOIS_DIAS = ( 2 * 24 * 60 * 60 * 1000 );

/**
 * Limpa o cache de jogadores expirado.
 */
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

/**
 * Retorna os dados calculados via getOverallPlayerStats().
 *
 * @param {string|number} id - ID do jogador (playerId).
 * @returns {Promise<object>} Dados agregados do jogador.
 */
export async function getPlayerInfo( id ) {
  const ultimaLimpezaCache = await getFromStorage( 'ultimaLimpezaCache' );
  if ( !ultimaLimpezaCache || ultimaLimpezaCache < Date.now() - DOIS_DIAS ) {
    await limparCache();
  }

  const lupaCache = ( await getFromStorage( 'lupaCache' ) ) || {};
  if ( lupaCache?.[id]?.ttl > Date.now() ) {
    console.log( `[GC-LUPA] Dados do jogador ${id} retornados do cache.` );
    return lupaCache[id];
  }

  try {
    console.log( `[GC-LUPA] Buscando estatísticas atualizadas do jogador ${id}...` );
    const stats = await getOverallPlayerStats( id );

    const response = {
      dataCriacao: stats.firstMonth || 'Desconhecido',
      totalPartidas: stats.totalMatches || 0,
      porcentagemVitoria: stats.winRate || 0,
      ttl: Date.now() + DOIS_DIAS
    };

    lupaCache[id] = response;
    await setStorage( 'lupaCache', lupaCache );

    console.log(
      `[GC-LUPA] Dados de ${id} armazenados em cache: ${response.totalPartidas} partidas, ${response.porcentagemVitoria}% de vitória.`
    );

    return response;
  } catch ( error ) {
    console.error( `[GC-LUPA] Erro ao buscar informações do jogador ${id}:`, error.message );
    throw error;
  }
}
