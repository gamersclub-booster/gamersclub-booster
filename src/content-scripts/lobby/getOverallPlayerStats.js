import axios from 'axios';
import { GC_URL, headers } from '../../lib/constants';
import { getUserInfo } from '../../lib/dom';

const { plID: DEFAULT_PLAYER_ID } = getUserInfo();
const PAGE_SIZE = 20;
const MIN_MONTH = '2023-09'; // CS2 lançado em setembro de 2023

async function fetchJSON( url, headers = {} ) {
  try {
    const res = await axios.get( url, { headers } );
    return res.data;
  } catch ( error ) {
    throw new Error(
      error.response ? `HTTP ${error.response.status}` : `Request failed: ${error.message}`
    );
  }
}

async function getAvailableMonths( playerId ) {
  const url = `https://${GC_URL}/api/box/history/${playerId}?json`;
  const data = await fetchJSON( url, headers );
  const months = data?.months || [];
  return months.filter( m => new Date( m + '-01' ) >= new Date( MIN_MONTH + '-01' ) );
}

async function getMonthMatches( playerId, month ) {
  const totalUrl = `https://${GC_URL}/api/box/historyFilterDate/${playerId}/${month}`;
  const totalData = await fetchJSON( totalUrl, headers );
  const totalMatches = Number( totalData?.matches?.matches || 0 );
  if ( !totalMatches ) {
    return [];
  }

  const totalPages = Math.ceil( totalMatches / PAGE_SIZE );
  const pagePromises = [];
  for ( let page = 0; page < totalPages; page++ ) {
    const pageUrl = `https://${GC_URL}/api/box/historyMatchesPage/${playerId}/${month}/${page}`;
    pagePromises.push( fetchJSON( pageUrl, headers ) );
  }

  const results = await Promise.allSettled( pagePromises );
  const allMatches = results.flatMap( r =>
    r.status === 'fulfilled' ? r.value?.monthMatches || [] : []
  );
  return allMatches;
}

export async function getOverallPlayerStats( playerId = DEFAULT_PLAYER_ID ) {
  //console.log( `[GC-STATS] Buscando estatísticas gerais para o jogador ${playerId}...` );

  const months = await getAvailableMonths( playerId );
  if ( !months.length ) { return { totalMatches: 0, totalWins: 0, winRate: 0, firstMonth: null }; }

  const firstMonth = months[months.length - 1];

  const monthPromises = months.map( month => getMonthMatches( playerId, month ) );
  const monthResults = await Promise.allSettled( monthPromises );
  const allMatches = monthResults.flatMap( r => ( r.status === 'fulfilled' ? r.value : [] ) );

  if ( !allMatches.length ) {
    return { totalMatches: 0, totalWins: 0, winRate: 0, firstMonth };
  }

  const totalMatches = allMatches.length;
  const totalWins = allMatches.filter( m => m.win ).length;
  const winRate = totalMatches > 0 ? ( totalWins / totalMatches ) * 100 : 0;

  const stats = {
    totalMatches,
    totalWins,
    winRate: parseFloat( winRate.toFixed( 2 ) ),
    firstMonth
  };

  //console.log(`[GC-STATS] Total: ${totalMatches}, Vitórias: ${totalWins}, WinRate: ${stats.winRate}%, Primeiro mês considerado: ${firstMonth}`);

  return stats;
}
