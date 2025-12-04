import { GC_URL, headers as auth, lobbyMapSuggestionsConsts } from '../../lib/constants';

const {
  PLAYERS_PER_TEAM,
  AVAILABLE_MAPS,
  CACHE_KEY_PREFIX,
  CACHE_TTL
} = lobbyMapSuggestionsConsts;

function loadCache( playerId ) {
  const raw = localStorage.getItem( CACHE_KEY_PREFIX + playerId );
  if ( !raw ) { return null; }

  try {
    const cached = JSON.parse( raw );
    if ( cached.expire > Date.now() ) {
      return cached.data;
    } else {
      localStorage.removeItem( CACHE_KEY_PREFIX + playerId );
      return null;
    }
  } catch {
    return null;
  }
}

function saveCache( playerId, data ) {
  localStorage.setItem(
    CACHE_KEY_PREFIX + playerId,
    JSON.stringify( {
      expire: Date.now() + CACHE_TTL,
      data
    } )
  );
}

async function fetchJSON( url, useAuth = false, extraHeaders = {} ) {
  try {
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      //Cookie: GC_COOKIE,
      ...extraHeaders
    };

    if ( useAuth ) {
      headers['Authorization'] = auth.Authorization;
    }

    const response = await fetch( url, {
      method: 'GET',
      headers,
      credentials: 'include'
    } );
    if ( !response.ok ) {
      throw new Error( `HTTP error! status: ${response.status}` );
    }
    return await response.json();
  } catch ( error ) {
    console.error(
      `[GC-BOOSTER] Falha ao buscar dados da URL: ${url}\n→ Erro: ${error.message}`
    );
    return null;
  }
}

async function getPlayerMapPreferences( data ) {
  const nome = data.nick || data.player?.nick || 'Desconhecido';
  const id = data.id || data.idplayer;

  const cached = loadCache( id );
  if ( cached ) {
    console.log( `[GC-BOOSTER] Cache encontrado para: ${nome}` );
    return cached;
  }

  console.log( `[GC-BOOSTER] Buscando histórico do jogador: ${nome}` );

  const allMatches = await fetchJSON( `https://${GC_URL}/api/box/history/${id}/maps`, true );

  if ( !allMatches || allMatches.length === 0 ) {
    return { id, nome, mapas: [] };
  }

  // Estatísticas por mapa
  const mapStats = {};
  allMatches.forEach( match => {
    const map = match?.map;
    if ( !map || !AVAILABLE_MAPS.includes( map ) ) { return; }

    if ( !mapStats[map] ) {
      mapStats[map] = { partidas: 0, vitorias: 0 };
    }

    mapStats[map].partidas++;
    if ( match.win ) {
      mapStats[map].vitorias++;
    }
  } );

  const relevantMaps = Object.entries( mapStats ).map( ( [ map, stats ] ) => ( {
    map,
    partidas: stats.partidas,
    vitorias: stats.vitorias,
    winRate: ( stats.vitorias / stats.partidas ) * 100
  } ) );

  const finalResult = {
    id,
    nome,
    mapas: relevantMaps.map( m => ( {
      nome: m.map,
      partidas: m.partidas,
      vitorias: m.vitorias,
      winRate: parseFloat( m.winRate.toFixed( 2 ) )
    } ) )
  };

  saveCache( id, finalResult );
  return finalResult;
}

// --- CÁLCULO DO VETO ---
function calcularSugestoesDeVeto( lobbyData, mapasVisiveis ) {
  console.log( '[GC-BOOSTER] Calculando sugestões de veto...' );

  const mapaStats = {};
  const mapasParaAvaliar = AVAILABLE_MAPS.filter( m => mapasVisiveis.includes( m ) );

  for ( const mapa of mapasParaAvaliar ) {
    // Média de winrate do time A no mapa
    const winRatesA = lobbyData.timeA
      .map( j => j.mapas?.find( m => m.nome === mapa )?.winRate )
      .filter( rate => rate !== undefined );
    const somaWinRateA = winRatesA.reduce( ( a, b ) => a + b, 0 );
    const mediaA = somaWinRateA / PLAYERS_PER_TEAM;

    // Média de winrate do time B no mapa
    const winRatesB = lobbyData.timeB
      .map( j => j.mapas?.find( m => m.nome === mapa )?.winRate )
      .filter( rate => rate !== undefined );
    const somaWinRateB = winRatesB.reduce( ( a, b ) => a + b, 0 );
    const mediaB = somaWinRateB / PLAYERS_PER_TEAM;

    mapaStats[mapa] = {
      timeA: parseFloat( mediaA.toFixed( 2 ) ),
      timeB: parseFloat( mediaB.toFixed( 2 ) ),
      diff: parseFloat( ( mediaA - mediaB ).toFixed( 2 ) ) // diferença percentual entre times
    };
  }

  // Determinar vantagem por mapa
  let maiorVantagemTimeA = { mapa: null, diff: -Infinity };
  let maiorVantagemTimeB = { mapa: null, diff: +Infinity };

  for ( const [ mapa, stats ] of Object.entries( mapaStats ) ) {
    if ( stats.diff > maiorVantagemTimeA.diff ) {
      maiorVantagemTimeA = { mapa, diff: stats.diff };
    }
    if ( stats.diff < maiorVantagemTimeB.diff ) {
      maiorVantagemTimeB = { mapa, diff: stats.diff };
    }
  }

  return {
    recomendacoes: {
      time_A: {
        pick: {
          mapa: maiorVantagemTimeA.mapa,
          vantagem_percentual: maiorVantagemTimeA.diff
        },
        ban: {
          mapa: maiorVantagemTimeB.mapa,
          vantagem_percentual: maiorVantagemTimeB.diff * -1
        }
      },
      time_B: {
        pick: {
          mapa: maiorVantagemTimeB.mapa,
          vantagem_percentual: maiorVantagemTimeB.diff * -1
        },
        ban: {
          mapa: maiorVantagemTimeA.mapa,
          vantagem_percentual: maiorVantagemTimeA.diff
        }
      }
    },
    estatisticasPorMapa: mapaStats
  };
}

async function analisadorDeLobby( matchId = '', mapasVisiveis = [] ) {
  console.log(
    `\n[GC-BOOSTER] INICIANDO ANÁLISE DE VETO PARA A PARTIDA ${matchId} ...`
  );

  const lobbyUrl =
    !matchId ?
      `https://${GC_URL}/api/lobby/match` :
      `https://${GC_URL}/lobby/partida/${matchId}/1`;
  const lobbyDataRaw = await fetchJSON( lobbyUrl );

  const teamA =
    lobbyDataRaw?.data?.teamA?.players ||
    lobbyDataRaw?.jogos?.players?.team_a ||
    [];
  const teamB =
    lobbyDataRaw?.data?.teamB?.players ||
    lobbyDataRaw?.jogos?.players?.team_b ||
    [];

  if ( !teamA.length || !teamB.length ) {
    return null;
  }

  const allPlayers = [ ...teamA, ...teamB ];

  const playerPreferences = await Promise.all(
    allPlayers.map( p => getPlayerMapPreferences( p ) )
  );

  const lobbyDataParaCalculo = {
    timeA: playerPreferences.filter( pref =>
      teamA.some( p => ( p?.id ?? p?.idplayer ) === pref.id )
    ),
    timeB: playerPreferences.filter( pref =>
      teamB.some( p => ( p?.id ?? p?.idplayer ) === pref.id )
    )
  };

  const resultadoFinal = calcularSugestoesDeVeto( lobbyDataParaCalculo, mapasVisiveis );

  return {
    ...resultadoFinal,
    lobbyDataParaCalculo
  };
}


export async function lobbyMapSuggestions( partidaId = '' ) {

  chrome.storage.sync.get( [ 'disableShowMapStatsSuggestions' ], function ( result ) {
    if ( result.disableShowMapStatsSuggestions ) {
      return;
    }
  } );

  const style = document.createElement( 'style' );
  style.innerHTML = `
    .gFpUQE {
      transform: translateY(-100px) !important;
    }
  `;
  document.head.appendChild( style );

  function criarBadge( texto, team ) {
    const badge = document.createElement( 'span' );
    badge.classList.add( 'gc-badge' );
    badge.style.display = 'inline-flex';
    badge.style.alignItems = 'center';
    badge.style.justifyContent = 'center';
    badge.style.fontSize = '12px';
    badge.style.fontWeight = 'bold';
    badge.style.backgroundColor = team === 'a' ? '#2196fd70' : '#7db720b3';
    badge.style.color = '#fff';
    badge.style.userSelect = 'none';
    badge.style.textAlign = 'center';
    badge.innerText = texto;
    badge.style.padding = '3px 8px';
    badge.style.height = '25px';
    badge.style.border = `1px solid ${team === 'a' ? '#2196fd' : '#7db720'}`;
    return badge;
  }

  function adicionarTooltip( element, team, mapName, lobbyDataParaCalculo ) {
    const teamData = team === 'a' ? lobbyDataParaCalculo.timeA : lobbyDataParaCalculo.timeB;

    const jogadores = teamData
      .map( j => {
        const mapa = j.mapas.find( m => m.nome === mapName );
        if ( !mapa ) { return null; }
        return { nome: j.nome, partidas: mapa.partidas, vitorias: mapa.vitorias, winRate: mapa.winRate };
      } )
      .filter( Boolean );

    const tooltip = document.createElement( 'div' );
    tooltip.classList.add( 'gc-tooltip' );
    Object.assign( tooltip.style, {
      position: 'fixed',
      background: 'rgba(0,0,0,0.9)',
      color: '#fff',
      padding: '8px 10px',
      borderRadius: '8px',
      fontSize: '12px',
      lineHeight: '1.4',
      zIndex: '999999',
      maxWidth: '250px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
      pointerEvents: 'none',
      whiteSpace: 'normal',
      display: 'none'
    } );

    tooltip.innerHTML = `
    <div style="font-weight:600; margin-bottom:5px; text-align:center;">
      ${team === 'a' ? 'Time A' : 'Time B'} – ${mapName}
    </div>
    ${jogadores.length > 0 ? jogadores.map( j => `
      <div style="margin-bottom:4px;">
        <strong>- ${j.nome}</strong>: ${j.vitorias}V / ${j.partidas}P 
        <span style="color:${team === 'a' ? '#2196fd' : '#7db720'}">(${j.winRate.toFixed( 1 )}%)</span>
      </div>
    ` ).join( '' ) : '<div style="margin-bottom:4px; color: #999;">Sem dados disponíveis</div>'}
  `;
    document.body.appendChild( tooltip );

    const mostrarTooltip = e => {
      tooltip.style.display = 'block';
      requestAnimationFrame( () => {
        const rect = e.target.getBoundingClientRect();
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
        tooltip.style.left = `${rect.left + ( rect.width / 2 ) - ( tooltip.offsetWidth / 2 )}px`;
      } );
    };

    const ocultarTooltip = () => {
      tooltip.style.display = 'none';
    };

    element.addEventListener( 'mouseenter', mostrarTooltip );
    element.addEventListener( 'mouseleave', ocultarTooltip );
  }



  async function processarLobby() {
    const mapasVisiveis = [ ...document.querySelectorAll( '.WasdMapCard__mapTitle' ) ].map(
      t => t.textContent.trim()
    );

    const result = await analisadorDeLobby( partidaId, mapasVisiveis );
    if ( !result || !result.recomendacoes ) {
      return;
    }

    const { lobbyDataParaCalculo } = result;

    const { recomendacoes, estatisticasPorMapa } = calcularSugestoesDeVeto(
      lobbyDataParaCalculo,
      mapasVisiveis
    );

    const cards = document.querySelectorAll( '.WasdMapCard' );

    if ( !cards.length ) {
      console.log( '[GC-BOOSTER] Nenhum card encontrado após análise.' );
      return;
    }

    document.querySelectorAll( '.gc-map-badges' ).forEach( el => el.remove() );
    document.querySelectorAll( '.gc-pick-sugestoes' ).forEach( el => el.remove() );

    cards.forEach( card => {
      const mapTitleEl = card.querySelector( '.WasdMapCard__mapTitle' );
      if ( !mapTitleEl ) { return; }

      const mapName = mapTitleEl.textContent.trim();
      const stats = estatisticasPorMapa[mapName];

      const badgesContainer = document.createElement( 'div' );
      badgesContainer.classList.add( 'gc-map-badges' );
      badgesContainer.style.display = 'flex';
      badgesContainer.style.justifyContent = 'center';
      badgesContainer.style.gap = '6px';
      badgesContainer.style.position = 'absolute';
      badgesContainer.style.bottom = '45px';
      badgesContainer.style.left = '50%';
      badgesContainer.style.transform = 'translateX(-50%)';

      if ( stats ) {
        const badgeA = criarBadge( `${stats.timeA}%`, 'a' );
        const badgeB = criarBadge( `${stats.timeB}%`, 'b' );
        badgesContainer.appendChild( badgeA );
        badgesContainer.appendChild( badgeB );

        adicionarTooltip( badgeA, 'a', mapName, lobbyDataParaCalculo );
        adicionarTooltip( badgeB, 'b', mapName, lobbyDataParaCalculo );
      }

      card.insertAdjacentElement( 'afterend', badgesContainer );
    } );

    const contentContainer = document.querySelector( '.Content-ssi08s-4' );
    if ( contentContainer && !document.querySelector( '.gc-pick-sugestoes' ) ) {
      const wrapper = document.createElement( 'div' );
      wrapper.classList.add( 'gc-pick-sugestoes' );
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.margin = '12px 20px';
      wrapper.style.textAlign = 'center';
      wrapper.style.fontWeight = '600';
      wrapper.style.gap = '15px';

      const pickMapaA = recomendacoes.time_A.pick.mapa;
      const pickMapaB = recomendacoes.time_B.pick.mapa;

      const pickStatsA = estatisticasPorMapa[pickMapaA];
      const pickStatsB = estatisticasPorMapa[pickMapaB];

      const percentA = pickStatsA ? pickStatsA.timeA.toFixed( 1 ) : 0;
      const percentB = pickStatsB ? pickStatsB.timeB.toFixed( 1 ) : 0;

      const boxInfo = document.createElement( 'div' );
      boxInfo.innerHTML = `
        <div style="color: #fff; text-align: center; font-size: 14px; margin-bottom: 10px; font-weight: 400; line-height: 1.5;">
          Confira abaixo as sugestões de <strong>pick</strong> com base no desempenho dos últimos <strong>90 dias</strong>.
          <br>Os resultados consideram a <strong>taxa de vitórias</strong> calculada a partir das partidas registradas por jogador.
        </div>
      `;

      const cardWrapper = document.createElement( 'div' );
      cardWrapper.style.display = 'flex';
      cardWrapper.style.justifyContent = 'space-between';

      const cardA = document.createElement( 'div' );
      cardA.innerHTML = `
        <div style="color:#2196fd;">Pick Sugerido Time A</div>
        <div>${pickMapaA} (${percentA}%)</div>
      `;

      const cardB = document.createElement( 'div' );
      cardB.innerHTML = `
        <div style="color:#7db720;">Pick Sugerido Time B</div>
        <div>${pickMapaB} (${percentB}%)</div>
      `;

      cardWrapper.appendChild( cardA );
      cardWrapper.appendChild( cardB );

      wrapper.appendChild( boxInfo );
      wrapper.appendChild( cardWrapper );
      contentContainer.insertAdjacentElement( 'beforebegin', wrapper );
    }

    console.log( '[GC-BOOSTER] Estatísticas e picks adicionados com sucesso.' );
  }

  const observer = new MutationObserver( () => {
    if ( document.querySelector( '.WasdMapCard' ) ) {
      observer.disconnect();
      processarLobby();
    }
  } );

  observer.observe( document.body, { childList: true, subtree: true } );
}
