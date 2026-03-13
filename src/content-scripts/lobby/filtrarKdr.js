//import { mostrarKdr } from './mostrarKdr.js';

let observerLobbiesWrapper = null;
let observerChallengesList = null;
let observerPage = null;
let frameAplicacao = null;
let timeoutSalvarFaixa = null;

const MENU_SELECTOR = '.hRweJW:nth-child(3)';

const encontrarMenu = () => {
  const all = document.querySelectorAll( MENU_SELECTOR );
  return all.length ? all[all.length - 1] : null;
};
const LOBBIES_WRAPPER_SELECTOR = '#lobbies-wrapper';
const CHALLENGES_LIST_SELECTOR = '.ChallengesList__list';
const CHALLENGE_ITEM_SELECTOR = '.LobbyChallengeCard__item';
const FILTER_OPTION_KEY = 'filtrarKdrMedioLobby';
const FILTER_MIN_OPTION_KEY = 'filtrarKdrMedioLobbyMin';
const FILTER_MAX_OPTION_KEY = 'filtrarKdrMedioLobbyMax';
const KDR_MIN_RANGE = 0;
const KDR_MAX_RANGE = 2;
const KDR_STEP = 0.01;

const isMaxSemLimite = value => value >= KDR_MAX_RANGE;

const normalizarValorFaixa = ( value, fallback ) => {
  const parsed = Number.parseFloat( value );
  if ( Number.isNaN( parsed ) ) { return fallback; }
  return Math.min( KDR_MAX_RANGE, Math.max( KDR_MIN_RANGE, parsed ) );
};

const agendarAplicacaoFiltro = () => {
  if ( frameAplicacao ) { return; }

  frameAplicacao = window.requestAnimationFrame( () => {
    frameAplicacao = null;
    aplicarFiltroKdrMedio();
    aplicarFiltroDesafios();
  } );
};

const formatarValorFaixa = value => {
  const fixed = Number( value ).toFixed( 2 );
  return fixed.endsWith( '.00' ) ? String( parseInt( fixed, 10 ) ) : fixed;
};

const normalizarTituloLobby = title => title?.trim() || '';

const obterMediaKdrPorTitulo = title => {
  const tituloNormalizado = normalizarTituloLobby( title );
  if ( !tituloNormalizado ) { return null; }

  const mediaElements = document.querySelectorAll( '[gcbooster_kdr_medio][gcbooster_lobby_title]' );

  return Array.from( mediaElements ).find( element => {
    return normalizarTituloLobby( element.getAttribute( 'gcbooster_lobby_title' ) ) === tituloNormalizado;
  } ) || null;
};

const calcularPercentualFaixa = value => {
  const intervalo = KDR_MAX_RANGE - KDR_MIN_RANGE;
  if ( intervalo <= 0 ) { return 0; }
  return ( ( value - KDR_MIN_RANGE ) / intervalo ) * 100;
};

const atualizarVisualSliderDuplo = ( min, max ) => {
  const rangeContainer = document.getElementById( 'filtrarKdrTrack' );
  if ( !rangeContainer ) { return; }

  const minPct = Math.max( 0, Math.min( 100, calcularPercentualFaixa( min ) ) );
  const maxPct = Math.max( 0, Math.min( 100, calcularPercentualFaixa( max ) ) );

  rangeContainer.style.background = `linear-gradient(to right,
    var(--color-gray-200) 0%,
    var(--color-gray-200) ${minPct}%,
    var(--color-light-blue) ${minPct}%,
    var(--color-light-blue) ${maxPct}%,
    var(--color-gray-200) ${maxPct}%,
    var(--color-gray-200) 100%)`;
};

const salvarFaixaPersistida = ( min, max ) => {
  if ( timeoutSalvarFaixa ) {
    window.clearTimeout( timeoutSalvarFaixa );
  }

  timeoutSalvarFaixa = window.setTimeout( () => {
    timeoutSalvarFaixa = null;
    chrome.storage.sync.set( {
      [FILTER_MIN_OPTION_KEY]: Number( min.toFixed( 1 ) ),
      [FILTER_MAX_OPTION_KEY]: Number( max.toFixed( 1 ) )
    } );
  }, 120 );
};

const carregarFaixaPersistida = callback => {
  chrome.storage.sync.get( [ FILTER_MIN_OPTION_KEY, FILTER_MAX_OPTION_KEY ], result => {
    const minPersistido = normalizarValorFaixa( result[FILTER_MIN_OPTION_KEY], KDR_MIN_RANGE );
    const maxPersistido = normalizarValorFaixa( result[FILTER_MAX_OPTION_KEY], KDR_MAX_RANGE );

    callback( {
      min: Math.min( minPersistido, maxPersistido ),
      max: Math.max( minPersistido, maxPersistido )
    } );
  } );
};

const obterValoresFiltroAtual = () => {
  const minInput = document.getElementById( 'filtrarKdrMinInput' );
  const maxInput = document.getElementById( 'filtrarKdrMaxInput' );

  if ( !minInput || !maxInput ) {
    return {
      min: KDR_MIN_RANGE,
      max: KDR_MAX_RANGE
    };
  }

  let min = normalizarValorFaixa( minInput.value, KDR_MIN_RANGE );
  const max = normalizarValorFaixa( maxInput.value, KDR_MAX_RANGE );

  if ( min > max ) {
    min = max;
    minInput.value = String( min );
  }

  return { min, max };
};

const atualizarLabelFaixa = ( min, max ) => {
  const valorElement = document.getElementById( 'filtrarKdrValor' );
  if ( !valorElement ) { return; }

  const maxTexto = isMaxSemLimite( max ) ? `${formatarValorFaixa( KDR_MAX_RANGE )}+` : formatarValorFaixa( max );
  const texto = `${formatarValorFaixa( min )} - ${maxTexto}`;
  if ( valorElement.textContent !== texto ) {
    valorElement.textContent = texto;
  }

  atualizarVisualSliderDuplo( min, max );
};

const sincronizarFaixaFiltro = tipoAlterado => {
  const minInput = document.getElementById( 'filtrarKdrMinInput' );
  const maxInput = document.getElementById( 'filtrarKdrMaxInput' );
  if ( !minInput || !maxInput ) { return; }

  let min = normalizarValorFaixa( minInput.value, KDR_MIN_RANGE );
  let max = normalizarValorFaixa( maxInput.value, KDR_MAX_RANGE );

  if ( min > max ) {
    if ( tipoAlterado === 'min' ) {
      max = min;
      maxInput.value = String( max );
    } else {
      min = max;
      minInput.value = String( min );
    }
  }

  minInput.value = String( min );
  maxInput.value = String( max );

  atualizarLabelFaixa( min, max );
  salvarFaixaPersistida( min, max );
  agendarAplicacaoFiltro();
};

const calcularKdrMedioLobby = room => {
  const kdrElements = room.querySelectorAll( '[gcbooster_kdr_lobby]' );
  if ( !kdrElements.length ) { return null; }

  let total = 0;
  let count = 0;

  kdrElements.forEach( element => {
    const valorAttr = element.getAttribute( 'kdr' );
    const valorTexto = element.textContent?.trim()?.replace( ',', '.' );
    const kdr = Number.parseFloat( valorAttr || valorTexto );

    if ( !Number.isNaN( kdr ) ) {
      total += kdr;
      count++;
    }
  } );

  if ( !count ) { return null; }
  return total / count;
};

const renderizarKdrMedioLobby = ( room, media ) => {
  const title = room.querySelector( '.LobbyRoom__title' );
  if ( !title ) { return; }

  let mediaElement = room.querySelector( '.gcbooster-kdr-media' );
  if ( !mediaElement ) {
    mediaElement = document.createElement( 'div' );
    mediaElement.className = 'gcbooster-kdr-media';
    mediaElement.style.cssText = 'font-size:11px;font-weight:600;color:#f39c12;';
    title.insertAdjacentElement( 'afterend', mediaElement );
  }

  mediaElement.setAttribute( 'gcbooster_kdr_medio', media.toFixed( 2 ) );
  mediaElement.setAttribute( 'gcbooster_lobby_title', normalizarTituloLobby( title.innerText ) );

  const mediaText = `KDR Médio: ${media.toFixed( 2 )}`;
  if ( mediaElement.textContent !== mediaText ) {
    mediaElement.textContent = mediaText;
  }
};

const aplicarFiltroDesafios = () => {
  const challengesList = document.querySelector( CHALLENGES_LIST_SELECTOR );
  if ( !challengesList ) { return; }

  const { min, max } = obterValoresFiltroAtual();
  const ignorarFiltroMaximo = isMaxSemLimite( max );
  const items = challengesList.querySelectorAll( CHALLENGE_ITEM_SELECTOR );

  items.forEach( item => {
    const info = item.querySelector( '.LobbyChallengeCard__info' );
    const titleElement = info?.querySelector( 'p' );
    const title = normalizarTituloLobby( titleElement?.textContent );
    const mediaElement = obterMediaKdrPorTitulo( title );
    const media = Number.parseFloat( mediaElement?.getAttribute( 'gcbooster_kdr_medio' ) );

    if ( !info || !titleElement || Number.isNaN( media ) ) {
      item.style.display = '';
      return;
    }

    let wrapper = info.querySelector( '.gcbooster-kdr-wrapper' );
    if ( !wrapper ) {
      wrapper = document.createElement( 'div' );
      wrapper.className = 'gcbooster-kdr-wrapper';
      wrapper.style.cssText = 'display:flex;flex-direction:column;gap:0;';
      titleElement.insertAdjacentElement( 'beforebegin', wrapper );
      wrapper.appendChild( titleElement );
    }

    let kdrElement = wrapper.querySelector( '.gcbooster-kdr' );
    if ( !kdrElement ) {
      kdrElement = document.createElement( 'span' );
      kdrElement.className = 'gcbooster-kdr';
      kdrElement.style.cssText = 'font-size:9px;color:orange;';
      wrapper.appendChild( kdrElement );
    }

    const textoKdr = `KDR Medio: ${media.toFixed( 2 )}`;
    if ( kdrElement.textContent !== textoKdr ) {
      kdrElement.textContent = textoKdr;
    }

    if ( media < min || ( !ignorarFiltroMaximo && media > max ) ) {
      item.style.display = 'none';
      return;
    }

    item.style.display = '';
  } );
};

const aplicarFiltroKdrMedio = () => {
  const wrapper = document.querySelector( LOBBIES_WRAPPER_SELECTOR );
  if ( !wrapper ) { return; }

  const { min, max } = obterValoresFiltroAtual();
  const ignorarFiltroMaximo = isMaxSemLimite( max );
  atualizarLabelFaixa( min, max );

  const rooms = wrapper.querySelectorAll( '.RoomCardWrapper' );

  rooms.forEach( room => {
    const media = calcularKdrMedioLobby( room );

    if ( media === null ) {
      room.style.display = '';
      return;
    }

    renderizarKdrMedioLobby( room, media );

    if ( media < min || ( !ignorarFiltroMaximo && media > max ) ) {
      room.style.display = 'none';
      return;
    }

    room.style.display = '';
  } );
};

const criarUiFiltro = () => {
  const menu = encontrarMenu();
  if ( !menu ) { return false; }

  if ( !document.getElementById( 'filtrarKdrMinInput' ) ) {
    const filtroSection = $( '<div/>', {
      id: 'gcbooster_section2',
      class: 'FilterLobby_section__3UmYp'
    } ).css( { width: '100%' } )
      .append( $( '<p/>', {
        class: 'FilterLobby_sectionLabel__1zPew',
        text: 'Filtrar por KDR Médio',
        css: { color: 'orange', fontSize: '12px' }
      } ) )
      .append( $( '<div/>', {
        class: 'FilterLobby_buttons__2ySGq',
        id: 'filtrarKdr'
      } ) );

    const filtroWrapper = $( '<div/>', { id: 'gcbooster_filtro_kdr_wrapper' } ).css( {
      'width': '100%',
      height: 'fit-content',
      display: 'flex',
      'align-items': 'center',
      'justify-content': 'flex-start'
    } ).append( filtroSection );

    $( menu ).append( filtroWrapper );

    const rangeContainer = $( '<div/>', { id: 'filtrarKdrRangeContainer' } ).css( {
      position: 'relative',
      display: 'flex',
      'align-items': 'center',
      flex: 1,
      width: '100%',
      height: '20px'
    } );

    const track = $( '<div/>', { id: 'filtrarKdrTrack' } ).css( {
      position: 'absolute',
      left: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      width: '100%',
      height: '6px',
      'border-radius': '15px',
      background: 'var(--color-gray-200)',
      'pointer-events': 'none'
    } );

    rangeContainer.append( track );

    rangeContainer
      .append( $( '<input/>', {
        id: 'filtrarKdrMinInput',
        type: 'range',
        min: String( KDR_MIN_RANGE ),
        max: String( KDR_MAX_RANGE ),
        step: String( KDR_STEP ),
        value: String( KDR_MIN_RANGE ),
        class: 'filterKdr filterKdrDual filterKdrMin'
      } ).css( {
        position: 'absolute',
        left: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        width: '100%',
        margin: 0,
        'pointer-events': 'none',
        'z-index': 4
      } ) )
      .append( $( '<input/>', {
        id: 'filtrarKdrMaxInput',
        type: 'range',
        min: String( KDR_MIN_RANGE ),
        max: String( KDR_MAX_RANGE ),
        step: String( KDR_STEP ),
        value: String( KDR_MAX_RANGE ),
        class: 'filterKdr filterKdrDual filterKdrMax'
      } ).css( {
        position: 'absolute',
        left: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        width: '100%',
        margin: 0,
        'pointer-events': 'none',
        'z-index': 5
      } ) );

    $( '#filtrarKdr' )
      .append( rangeContainer )
      .append( $( '<div/>', {
        id: 'filtrarKdrValor',
        class: 'gcbooster-filtrar-kdr-valor'
      } ).css( {
        boxSizing: 'border-box',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'rgb(255, 255, 255)',
        fontWeight: 600,
        fontSize: '12px',
        width: '75px',
        textAlign: 'center',
        height: '20px',
        background: 'var(--rebrand-success-primary)',
        borderRadius: '2px',
        marginLeft: '8px',
        marginRight: '10px'
      } ).text( '0.00 - 2+' ) )
      .css( {
        height: '20px',
        display: 'flex',
        'flex-direction': 'row',
        gap: '8px',
        'align-items': 'center'
      } );

    $( '#filtrarKdrMinInput' ).on( 'input change', () => sincronizarFaixaFiltro( 'min' ) );
    $( '#filtrarKdrMaxInput' ).on( 'input change', () => sincronizarFaixaFiltro( 'max' ) );

    $( '#filtrarKdrMinInput' ).on( 'mousedown touchstart', () => {
      $( '#filtrarKdrMinInput' ).css( 'z-index', 6 );
      $( '#filtrarKdrMaxInput' ).css( 'z-index', 5 );
    } );

    $( '#filtrarKdrMaxInput' ).on( 'mousedown touchstart', () => {
      $( '#filtrarKdrMaxInput' ).css( 'z-index', 6 );
      $( '#filtrarKdrMinInput' ).css( 'z-index', 5 );
    } );

    carregarFaixaPersistida( ( { min, max } ) => {
      const minInput = document.getElementById( 'filtrarKdrMinInput' );
      const maxInput = document.getElementById( 'filtrarKdrMaxInput' );
      if ( !minInput || !maxInput ) { return; }

      minInput.value = String( min );
      maxInput.value = String( max );
      atualizarLabelFaixa( min, max );
      agendarAplicacaoFiltro();
    } );
  }

  return true;
};

const iniciarObserverLobbies = () => {
  const wrapper = document.querySelector( LOBBIES_WRAPPER_SELECTOR );
  if ( !wrapper ) { return; }

  if ( observerLobbiesWrapper ) {
    observerLobbiesWrapper.disconnect();
  }

  observerLobbiesWrapper = new MutationObserver( () => {
    agendarAplicacaoFiltro();
  } );

  observerLobbiesWrapper.observe( wrapper, {
    childList: true,
    subtree: true
  } );

  agendarAplicacaoFiltro();
};

const iniciarObserverDesafios = () => {
  const challengesList = document.querySelector( CHALLENGES_LIST_SELECTOR );
  if ( !challengesList ) { return; }

  if ( observerChallengesList ) {
    observerChallengesList.disconnect();
  }

  observerChallengesList = new MutationObserver( () => {
    agendarAplicacaoFiltro();
  } );

  observerChallengesList.observe( challengesList, {
    childList: true,
    subtree: true
  } );

  agendarAplicacaoFiltro();
};

const limparFiltro = () => {
  if ( observerLobbiesWrapper ) {
    observerLobbiesWrapper.disconnect();
    observerLobbiesWrapper = null;
  }

  if ( observerChallengesList ) {
    observerChallengesList.disconnect();
    observerChallengesList = null;
  }

  if ( observerPage ) {
    observerPage.disconnect();
    observerPage = null;
  }

  if ( frameAplicacao ) {
    window.cancelAnimationFrame( frameAplicacao );
    frameAplicacao = null;
  }

  if ( timeoutSalvarFaixa ) {
    window.clearTimeout( timeoutSalvarFaixa );
    timeoutSalvarFaixa = null;
  }

  $( '#gcbooster_section2' ).remove();
  $( `${LOBBIES_WRAPPER_SELECTOR} .RoomCardWrapper` ).css( 'display', '' );
};

const adicionarFiltroKdr = () => {
  chrome.storage.sync.get( [ FILTER_OPTION_KEY ], result => {
    if ( result[FILTER_OPTION_KEY] === false ) {
      limparFiltro();
      return;
    }

    criarUiFiltro();
    iniciarObserverLobbies();

    if ( observerPage ) {
      observerPage.disconnect();
    }

    observerPage = new MutationObserver( mutations => {
      const temMudancaRelevante = mutations.some( mutation => {
        return Array.from( mutation.addedNodes ).some( node => {
          if ( !( node instanceof Element ) ) { return false; }
          return node.matches( MENU_SELECTOR ) ||
            !!node.querySelector( MENU_SELECTOR ) ||
            node.matches( LOBBIES_WRAPPER_SELECTOR ) ||
            !!node.querySelector( LOBBIES_WRAPPER_SELECTOR ) ||
            node.matches( CHALLENGES_LIST_SELECTOR ) ||
            !!node.querySelector( CHALLENGES_LIST_SELECTOR ) ||
            node.matches( CHALLENGE_ITEM_SELECTOR ) ||
            !!node.querySelector( CHALLENGE_ITEM_SELECTOR );
        } );
      } );

      if ( !temMudancaRelevante ) { return; }

      const hasUi = !!document.getElementById( 'filtrarKdrMinInput' );
      if ( !hasUi ) {
        //mostrarKdr();
        criarUiFiltro();
      }

      if ( !document.querySelector( LOBBIES_WRAPPER_SELECTOR ) ) { return; }
      if ( !observerLobbiesWrapper ) {
        iniciarObserverLobbies();
      }

      if ( document.querySelector( CHALLENGES_LIST_SELECTOR ) ) {
        if ( !observerChallengesList ) {
          iniciarObserverDesafios();
        }
      } else if ( observerChallengesList ) {
        observerChallengesList.disconnect();
        observerChallengesList = null;
      }

      agendarAplicacaoFiltro();

    } );

    observerPage.observe( document.body, {
      childList: true,
      subtree: true
    } );
  } );
};

export { adicionarFiltroKdr };

