import { GC_URL, headers as auth, lobbyMapSuggestionsConsts } from '../../lib/constants';

const {
  PAGE_SIZE,
  MONTH_LIMIT,
  PLAYERS_PER_TEAM,
  AVAILABLE_MAPS
} = lobbyMapSuggestionsConsts;

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

  console.log( `[GC-BOOSTER] Analisando jogador: ${nome} (ID: ${id})` );

  const monthsData = await fetchJSON( `https://${GC_URL}/api/box/history/${id}?json`, true );
  const availableMonths = monthsData?.months;

  if ( !availableMonths || availableMonths.length === 0 ) {
    console.warn( `[GC-BOOSTER] Nenhum histórico de partidas encontrado para ${nome}.` );
    return { id, nome, mapas: [] };
  }

  const monthsToFetch = availableMonths.slice( 0, MONTH_LIMIT ?? 1 );

  const allMatches = [];

  for ( const month of monthsToFetch ) {
    const totalMatchesData = await fetchJSON(
      `https://${GC_URL}/api/box/historyFilterDate/${id}/${month}`,
      true
    );

    const totalMatches = totalMatchesData?.matches?.matches || 0;

    if ( totalMatches === 0 ) {
      console.warn( `[GC-BOOSTER] Nenhuma partida encontrada para ${nome} em ${month}.` );
      continue;
    }

    const totalPages = Math.ceil( totalMatches / PAGE_SIZE );
    const pagePromises = Array.from( { length: totalPages }, ( _, i ) =>
      fetchJSON( `https://${GC_URL}/api/box/historyMatchesPage/${id}/${month}/${i}`, true )
    );

    const pagesResults = await Promise.all( pagePromises );
    const monthMatches = pagesResults.flatMap( page => page?.monthMatches || [] );
    allMatches.push( ...monthMatches );
  }

  if ( allMatches.length === 0 ) {
    console.warn(
      `[GC-BOOSTER] Nenhuma partida encontrada nos últimos ${MONTH_LIMIT} mês(es) para ${nome}.`
    );
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

  // Calcula winrate por mapa
  const relevantMaps = Object.entries( mapStats )
    .map( ( [ map, stats ] ) => ( {
      map,
      partidas: stats.partidas,
      vitorias: stats.vitorias,
      winRate: ( stats.vitorias / stats.partidas ) * 100
    } ) );

  if ( relevantMaps.length === 0 ) {
    console.log( `- ${nome} não possui mapas com dados suficientes.` );
    return { id, nome, mapas: [] };
  }

  console.log( `[GC-BOOSTER] Estatísticas calculadas para ${nome}:` );
  relevantMaps.forEach( m =>
    console.log(
      `   - ${m.map}: ${m.vitorias} vitórias em ${m.partidas} partidas (${m.winRate.toFixed( 2 )}%)`
    )
  );

  return {
    id,
    nome,
    mapas: relevantMaps.map( m => ( {
      nome: m.map,
      partidas: m.partidas,
      vitorias: m.vitorias,
      winRate: parseFloat( m.winRate.toFixed( 2 ) )
    } ) )
  };
}

// --- CÁLCULO DO VETO ---
function calcularSugestoesDeVeto( lobbyData ) {
  console.log( '[GC-BOOSTER] Calculando sugestões de veto...' );

  const mapaStats = {};

  for ( const mapa of AVAILABLE_MAPS ) {
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

  console.log( '[GC-BOOSTER] Estatísticas consolidadas por mapa:' );
  Object.entries( mapaStats ).forEach( ( [ mapa, stats ] ) => {
    console.log(
      `   - ${mapa}: Time A ${stats.timeA.toFixed( 2 )}% | Time B ${stats.timeB.toFixed( 2 )}%`
    );
  } );

  console.log(
    `[GC-BOOSTER] Melhor mapa para Time A: ${maiorVantagemTimeA.mapa} (+${maiorVantagemTimeA.diff.toFixed( 2 )}%)`
  );
  console.log(
    `[GC-BOOSTER] Melhor mapa para Time B: ${maiorVantagemTimeB.mapa} (${( maiorVantagemTimeB.diff.toFixed( 2 ) * -1 )}%)`
  );

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

async function analisadorDeLobby( matchId = '' ) {
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
    console.error(
      '[GC-BOOSTER] ERRO: Não foi possível obter os dados dos jogadores.'
    );
    return null;
  }

  const allPlayers = [ ...teamA, ...teamB ];

  const playerPreferences = await Promise.all(
    allPlayers.map( p => getPlayerMapPreferences( p ) )
  );

  console.log( '\n[GC-BOOSTER] --- DADOS COLETADOS ---' );
  console.log( JSON.stringify( playerPreferences, null, 2 ) );

  const lobbyDataParaCalculo = {
    timeA: playerPreferences.filter( pref =>
      teamA.some( p => ( p?.id ?? p?.idplayer ) === pref.id )
    ),
    timeB: playerPreferences.filter( pref =>
      teamB.some( p => ( p?.id ?? p?.idplayer ) === pref.id )
    )
  };

  console.log( '\n[GC-BOOSTER] --- DADOS PARA CALCULO ---' );
  console.log( JSON.stringify( lobbyDataParaCalculo, null, 2 ) );

  const resultadoFinal = calcularSugestoesDeVeto( lobbyDataParaCalculo );

  console.log( '\n[GC-BOOSTER] --- RESULTADO FINAL ---' );
  console.log( JSON.stringify( resultadoFinal, null, 2 ) );

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

  console.log( '[GC-BOOSTER] Aguardando carregamento dos cards de veto...' );

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
    console.log( '[GC-BOOSTER] Detectado DOM com mapas, iniciando análise...' );
    const result = await analisadorDeLobby( partidaId );
    if ( !result || !result.recomendacoes ) {
      console.warn( '[GC-BOOSTER] Nenhum dado retornado pela análise do lobby.' );
      return;
    }

    const { recomendacoes, estatisticasPorMapa, lobbyDataParaCalculo } = result;
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

      } else {
        const badgeN = criarBadge( '--', 'a' );
        badgesContainer.appendChild( badgeN );
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
