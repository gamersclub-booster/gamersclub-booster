import { GC_URL, headers as auth, lobbyMapSuggestionsConsts } from '../../lib/constants';

const {
  PLAYERS_PER_TEAM,
  AVAILABLE_MAPS,
  CACHE_KEY_PREFIX,
  CACHE_TTL,
  DEBUG_FAKE_DATA
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

  const COLOR_A_SOLID = 'oklch(62% 0.25 292)'; // roxo intenso neon
  const COLOR_B_SOLID = 'oklch(70% 0.22 50)'; // laranja quente neon
  const COLOR_AB_SOLID = 'oklch(72% 0.18 180)'; // teal/esmeralda

  function criarBadge( texto, team ) {
    const badge = document.createElement( 'span' );
    badge.classList.add( 'gc-badge' );
    badge.style.display = 'inline-flex';
    badge.style.alignItems = 'center';
    badge.style.justifyContent = 'center';
    badge.style.fontSize = '12px';
    badge.style.fontWeight = 'bold';
    const borderColor = team === 'a' ? COLOR_A_SOLID : COLOR_B_SOLID;
    badge.style.backgroundColor = `color-mix(in oklch, ${borderColor} 90%, transparent)`;
    badge.style.color = '#fff';
    badge.style.userSelect = 'none';
    badge.style.textAlign = 'center';
    badge.innerText = texto;
    badge.style.padding = '3px 8px';
    badge.style.height = '25px';
    badge.style.border = `1px solid ${borderColor}`;
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

    const nomeTime = team === 'a' ?
      ( lobbyDataParaCalculo.timeA[0]?.nome || 'Time A' ) :
      ( lobbyDataParaCalculo.timeB[0]?.nome || 'Time B' );
    const tooltipColor = team === 'a' ? COLOR_A_SOLID : COLOR_B_SOLID;

    tooltip.innerHTML = `
    <div style="font-weight:600; margin-bottom:5px; text-align:center; color:${tooltipColor};">
      ${nomeTime} – ${mapName}
    </div>
    ${jogadores.length > 0 ? jogadores.map( j => `
      <div style="margin-bottom:4px;">
        <strong>- ${j.nome}</strong>: ${j.vitorias}V / ${j.partidas}P 
        <span style="color:${tooltipColor}">(${j.winRate.toFixed( 1 )}%)</span>
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

    if ( DEBUG_FAKE_DATA ) {
      console.log( '[GC-BOOSTER] MODO DEBUG ATIVO — usando dados simulados' );
      lobbyDataParaCalculo.timeA = Array.from( { length: 5 } ).map( ( _, i ) => ( {
        id: i + 1,
        nome: 'Player A' + i,
        mapas: AVAILABLE_MAPS.map( map => {
          const partidas = 20;
          const vitorias = Math.floor( Math.random() * ( partidas + 1 ) );
          const winRate = parseFloat( ( ( vitorias / partidas ) * 100 ).toFixed( 2 ) );
          return {
            nome: map,
            partidas,
            vitorias,
            winRate
          };

        } )
      } ) );

      lobbyDataParaCalculo.timeB = Array.from( { length: 5 } ).map( ( _, i ) => ( {
        id: i + 10,
        nome: 'Player B' + i,
        mapas: AVAILABLE_MAPS.map( map => {
          const partidas = 20;
          const vitorias = Math.floor( Math.random() * ( partidas + 1 ) );
          const winRate = parseFloat( ( ( vitorias / partidas ) * 100 ).toFixed( 2 ) );
          return {
            nome: map,
            partidas,
            vitorias,
            winRate
          };

        } )
      } ) );
    }



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

      let suggestionText = null;
      let color = null;

      const nomeTimeA = lobbyDataParaCalculo.timeA[0]?.nome || 'Time A';
      const nomeTimeB = lobbyDataParaCalculo.timeB[0]?.nome || 'Time B';

      if ( recomendacoes.time_A.pick.mapa === recomendacoes.time_B.pick.mapa && mapName === recomendacoes.time_A.pick.mapa ) {
        suggestionText = `PICK: ${nomeTimeA} & ${nomeTimeB}`;
        color = COLOR_AB_SOLID;
      } else if ( mapName === recomendacoes.time_A.pick.mapa ) {
        suggestionText = `PICK: ${nomeTimeA}`;
        color = COLOR_A_SOLID;
      } else if ( mapName === recomendacoes.time_B.pick.mapa ) {
        suggestionText = `PICK: ${nomeTimeB}`;
        color = COLOR_B_SOLID;
      }

      if ( suggestionText ) {
        card.querySelectorAll( '.gc-suggestion-badge' ).forEach( e => e.remove() );

        const sug = document.createElement( 'div' );
        sug.classList.add( 'gc-suggestion-badge' );

        Object.assign( sug.style, {
          position: 'absolute',
          top: '-15px',
          left: '50%',
          transform: 'translateX(-50%)',
          borderRadius: '4px',
          background: `color-mix(in oklch, ${color} 90%, transparent)`,
          border: `1px solid ${color}`,
          padding: '4px 10px',
          fontSize: '11px',
          fontWeight: '700',
          color: '#fff',
          zIndex: '1000',
          width: 'max-content',
          maxWidth: '160px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          letterSpacing: '0.05em'
        } );

        sug.innerText = suggestionText;
        card.style.position = 'relative';
        card.style.boxShadow = `0 0 18px 3px color-mix(in oklch, ${color} 55%, transparent), 0 0 6px 1px ${color}`;
        card.style.outline = `1px solid color-mix(in oklch, ${color} 70%, transparent)`;
        card.parentNode.insertBefore( sug, card );
      }

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

      contentContainer.insertAdjacentElement( 'beforebegin', wrapper );
    }

    const teamContainers = document.querySelectorAll( '.kucNpa' );
    document.querySelectorAll( '.gc-team-indicator' ).forEach( el => el.remove() );

    if ( teamContainers.length >= 1 ) {
      const createIndicator = color => {
        const container = document.createElement( 'div' );
        container.classList.add( 'gc-team-indicator' );
        Object.assign( container.style, {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          marginTop: '4px',
          width: '40%'
        } );

        const bar = document.createElement( 'div' );
        Object.assign( bar.style, {
          height: '4px',
          width: '100%',
          backgroundColor: `color-mix(in oklch, ${color} 90%, transparent)`,
          borderRadius: '4px',
          boxShadow: `0 0 12px ${color}80`,
          border: `1px solid color-mix(in oklch, ${color} 40%, transparent)`
        } );

        const label = document.createElement( 'span' );
        label.innerText = 'Cor do Time';
        Object.assign( label.style, {
          fontSize: '10px',
          fontWeight: '700',
          color: `color-mix(in oklch, ${color} 85%, white)`,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          userSelect: 'none',
          lineHeight: '1'
        } );

        container.appendChild( bar );
        container.appendChild( label );
        return container;
      };

      if ( teamContainers[0] ) {
        teamContainers[0].insertAdjacentElement( 'afterend', createIndicator( COLOR_A_SOLID ) );
      }
      if ( teamContainers[1] ) {
        teamContainers[1].insertAdjacentElement( 'afterend', createIndicator( COLOR_B_SOLID ) );
      }
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
