import axios from 'axios';
import { GC_URL, headers } from '../../lib/constants';
import { getUserInfo } from '../../lib/dom';

const { plID: PLAYER_ID } = getUserInfo();
const PAGE_SIZE = 20;
const DEFAULT_MONTHS = 1;
const CACHE_DURATION = 60 * 60 * 1000;

async function fetchJSON( url, headers = {} ) {
  try {
    const res = await axios.get( url, { headers } );
    return res.data;
  } catch ( error ) {
    if ( error.response ) {
      throw new Error( `HTTP error! status: ${error.response.status}` );
    } else {
      throw new Error( `Request failed: ${error.message}` );
    }
  }
}

async function getAvailableMonths() {
  const url = `https://${GC_URL}/api/box/history/${PLAYER_ID}?json`;
  return ( await fetchJSON( url, headers ) ).months;
}

async function getMonthTotalMatches( month ) {
  const url = `https://${GC_URL}/api/box/historyFilterDate/${PLAYER_ID}/${month}`;
  return ( await fetchJSON( url ) ).matches.matches;
}

async function getAllMonthMatches( month, totalMatches ) {
  let allMatches = [];
  const totalPages = Math.ceil( totalMatches / PAGE_SIZE );
  const promises = [];

  for ( let page = 0; page < totalPages; page++ ) {
    const url = `https://${GC_URL}/api/box/historyMatchesPage/${PLAYER_ID}/${month}/${page}`;
    promises.push( fetchJSON( url ) );
  }

  const results = await Promise.all( promises );
  results.forEach( data => {
    allMatches = allMatches.concat( data.monthMatches );
  } );

  return allMatches;
}

function compareMaps( a, b, type = 'best' ) {
  if ( a.winRate === b.winRate ) {
    return a.partidas > b.partidas ? a : b;
  }

  if ( type === 'best' ) {
    return a.winRate > b.winRate ? a : b;
  }

  return a.winRate < b.winRate ? a : b;
}

function aggregateStats( matches ) {
  const mapStats = {};
  let totalWins = 0, totalMatches = 0;

  matches.forEach( match => {
    const map = match.map;
    if ( !mapStats[map] ) { mapStats[map] = { partidas: 0, vitorias: 0 }; }
    mapStats[map].partidas++;
    if ( match.win ) {
      mapStats[map].vitorias++;
      totalWins++;
    }
    totalMatches++;
  } );

  for ( const map in mapStats ) {
    mapStats[map].taxaVitoria = ( ( mapStats[map].vitorias / mapStats[map].partidas ) * 100 ).toFixed( 2 );
  }

  const mapsArray = Object.entries( mapStats ).map( ( [ map, s ] ) => ( {
    map,
    partidas: s.partidas,
    vitorias: s.vitorias,
    winRate: parseFloat( s.taxaVitoria )
  } ) );

  const filtered = mapsArray.filter( m => m.partidas >= 5 );
  let bestMap = null, worstMap = null;

  if ( filtered.length > 0 ) {
    bestMap = filtered.reduce( ( a, b ) => compareMaps( a, b, 'best' ) );
    worstMap = filtered.reduce( ( a, b ) => compareMaps( a, b, 'worst' ) );
  }

  const overall = {
    totalMatches,
    totalWins,
    winRate: totalMatches > 0 ? ( ( totalWins / totalMatches ) * 100 ).toFixed( 2 ) : '0.00',
    bestMap,
    worstMap
  };

  return { mapStats, overall };
}

function injectHTML() {
  const style = document.createElement( 'style' );
  style.textContent = `
:root {
  --gc-primary-color: #195aff;
  --gc-bg-dark: #1e1e2c;
  --gc-bg-light: #2c2c3e;
  --gc-text-primary: #ebebeb;
  --gc-text-secondary: #a0a0b8;
  --gc-win-color: #81c784;
  --gc-loss-color: #e57373;
}
.gc-stats-container {
  color: var(--gc-text-primary);
  background: #1f1f1f;
  border: 1px solid #faf9f714;
  margin: 1rem auto;
  width: 100%;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
.gc-stats-controls {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
}
.gc-stats-controls button {
  background: #2d2d2d;
  color: #fff;
  border: 1px solid #373737;
  padding: 0.3rem 0.6rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.75rem;
  border-radius: 0;
}
.gc-stats-controls button:hover {
  background: #3a3a4c;
  color: var(--gc-text-primary);
}
.gc-stats-controls button.active {
  background: var(--gc-primary-color);
  color: white;
  border-color: var(--gc-primary-color);
  font-weight: bold;
}
.gc-stats-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}
.gc-stats-loading .spinner {
  width: 30px;
  height: 30px;
  border: 3px solid var(--gc-bg-light);
  border-top: 3px solid var(--gc-primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 0.8rem;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.gc-stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  user-select: none;
  transition: background 0.2s ease;
}
.gc-stats-summary {
  display: flex;
  gap: 1.2rem;
  font-size: 0.8rem;
  align-items: center;
  flex-wrap: wrap;
}
.gc-stats-summary span {
  color: var(--gc-text-secondary);
}
.gc-stats-summary strong {
  color: var(--gc-text-primary);
  font-weight: 600;
}
.gc-stats-summary .win {
  color: var(--gc-win-color);
}
.gc-stats-summary .loss {
  color: var(--gc-loss-color);
}
#gcStatsToggle {
  font-size: 1.2rem;
  transition: transform 0.3s ease;
}
#gcStatsToggle.collapsed {
  transform: rotate(-90deg);
}
.gc-stats-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem;
  padding: 1rem;
  max-height: 500px;
  overflow-y: auto;
  transition: all 0.4s ease-out;
  visibility: visible;
}
.gc-stats-content.hidden {
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  overflow: hidden;
  visibility: hidden;
}
.gc-stats-card {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.75rem;
  font-size: 0.8rem;
  text-align: center;
  border-radius: 0;
  border: 1px solid #faf9f714;
}
.gc-stats-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 0.95rem;
  color: #fff;
  font-weight: 600;
}
.gc-stats-card p {
  margin: 0.2rem 0;
  color: var(--gc-text-secondary);
}
.gc-stats-card .win-rate {
  font-size: 1.1rem;
  color: var(--gc-text-primary);
  font-weight: 600;
  margin-top: 0.4rem;
}
`;
  document.head.appendChild( style );

  const container = document.createElement( 'div' );
  container.id = 'gcStatsContainer';
  container.className = 'gc-stats-container';
  container.innerHTML = `
    <div id="gcStatsControls" class="gc-stats-controls">
      <button data-months="1">1 Mês</button>
      <button data-months="3">3 Meses</button>
      <button data-months="6">6 Meses</button>
      <button data-months="0">Tudo</button> 
    </div>
    <div id="gcStatsLoading" class="gc-stats-loading" style="display:none;">
      <div class="spinner"></div><p>Carregando estatísticas...</p>
    </div>
    <div id="gcStatsError" style="display:none; padding: 1rem; color: var(--gc-loss-color); text-align:center;"></div>
    <div id="gcStatsBody" style="display:none;">
      <div id="gcStatsHeader" class="gc-stats-header" title="Clique para expandir/recolher os detalhes">
        <div id="gcStatsSummary" class="gc-stats-summary"></div>
        <div id="gcStatsToggle" class="collapsed">▼</div>
      </div>
      <div id="gcStatsContent" class="gc-stats-content hidden"></div>
    </div>
  `;

  const lobbyHeader = document.querySelector( '.LobbyHeader' );
  if ( lobbyHeader ) {
    lobbyHeader.parentNode.insertBefore( container, lobbyHeader );
  }

}

function renderStats( stats ) {
  const summary = document.getElementById( 'gcStatsSummary' );
  const content = document.getElementById( 'gcStatsContent' );

  if ( stats.overall.totalMatches === 0 ) {
    summary.innerHTML = '<span>Nenhuma partida encontrada para este período.</span>';
    content.innerHTML = '';
    return;
  }

  summary.innerHTML = `
      <span>Partidas: <strong>${stats.overall.totalMatches}</strong></span>
      <span>Win Rate: <strong class="win">${stats.overall.winRate}%</strong></span>
      ${stats.overall.bestMap ? `
        <span>Melhor: <strong>${stats.overall.bestMap.map}</strong> (<strong class="win">
        ${stats.overall.bestMap.winRate.toFixed( 2 )}%</strong>)
        </span>` : ''}
      ${stats.overall.worstMap ? `
        <span>Pior: <strong>${stats.overall.worstMap.map}</strong> (<strong class="loss">
        ${stats.overall.worstMap.winRate.toFixed( 2 )}%</strong>)
        </span>` : ''}
    `;

  const sortedMaps = Object.entries( stats.mapStats ).sort( ( [ , a ], [ , b ] ) => b.partidas - a.partidas );

  content.innerHTML = '';
  for ( const [ map, s ] of sortedMaps ) {
    const card = document.createElement( 'div' );
    card.className = 'gc-stats-card';
    card.innerHTML = `<h3>${map}</h3><p>${s.vitorias} V | ${s.partidas} P</p><p class="win-rate">${s.taxaVitoria}%</p>`;
    content.appendChild( card );
  }
}

function setUIState( state ) {
  document.getElementById( 'gcStatsLoading' ).style.display = state === 'loading' ? 'flex' : 'none';
  document.getElementById( 'gcStatsBody' ).style.display = state === 'success' ? 'block' : 'none';
  document.getElementById( 'gcStatsError' ).style.display = state === 'error' ? 'block' : 'none';
  if ( state === 'error' ) { document.getElementById( 'gcStatsError' ).innerHTML = '<p>Erro ao carregar as estatísticas. Verifique o console.</p>'; }
}

async function loadStatsForPeriod( monthsCount ) {
  setUIState( 'loading' );

  document.querySelectorAll( '#gcStatsControls button' ).forEach( btn => {
    btn.classList.toggle( 'active', parseInt( btn.dataset.months ) === monthsCount );
  } );

  const cacheKey = `gc_stats_cache_${PLAYER_ID}_${monthsCount}`;

  try {
    const cachedData = localStorage.getItem( cacheKey );
    if ( cachedData ) {
      const { stats, timestamp } = JSON.parse( cachedData );
      if ( Date.now() - timestamp < CACHE_DURATION ) {
        console.log( `GC Stats: Carregado do cache para ${monthsCount} mes(es).` );
        renderStats( stats );
        setUIState( 'success' );
        return;
      }
    }
  } catch ( e ) {
    console.error( 'GC Stats: Erro ao ler o cache.', e );
    localStorage.removeItem( cacheKey );
  }

  try {
    console.log( `GC Stats: Buscando dados da API para ${monthsCount} mes(es)...` );
    const availableMonths = await getAvailableMonths();
    const monthsToFetch = monthsCount === 0 ? availableMonths : availableMonths.slice( 0, monthsCount );

    let allMatches = [];
    const promises = monthsToFetch.map( async month => {
      const totalMatches = await getMonthTotalMatches( month );
      return getAllMonthMatches( month, totalMatches );
    } );

    const results = await Promise.all( promises );
    allMatches = results.flat();

    const stats = aggregateStats( allMatches );

    try {
      const dataToCache = { stats, timestamp: Date.now() };
      localStorage.setItem( cacheKey, JSON.stringify( dataToCache ) );
    } catch ( e ) {
      console.error( 'GC Stats: Erro ao salvar dados no cache.', e );
    }

    renderStats( stats );
    setUIState( 'success' );
  } catch ( err ) {
    console.error( 'Erro ao buscar estatísticas da API:', err );
    setUIState( 'error' );
  }
}

export const showStats = () => {

  chrome.storage.sync.get( [ 'showStats' ], function ( result ) {
    if ( result.showStats ) {
      injectHTML();
      const header = document.getElementById( 'gcStatsHeader' );
      if ( header ) {
        header.addEventListener( 'click', () => {
          document.getElementById( 'gcStatsContent' ).classList.toggle( 'hidden' );
          document.getElementById( 'gcStatsToggle' ).classList.toggle( 'collapsed' );
        } );
      }

      const controls = document.getElementById( 'gcStatsControls' );
      if ( controls ) {
        controls.addEventListener( 'click', event => {
          if ( event.target.tagName === 'BUTTON' ) {
            const months = event.target.dataset.months;
            loadStatsForPeriod( parseInt( months ) );
          }
        } );
      }

      loadStatsForPeriod( DEFAULT_MONTHS );
    }
  } );
};
