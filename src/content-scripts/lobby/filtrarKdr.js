// Statistics extracted from the original filtrarKdr module; independent of filtering.
const normalizarTituloLobby = title => title?.trim() || '';

export const calcularKdrMedioLobby = ( room, values = null ) => {
  if ( values ) {
    const known = values.filter( value => value !== null );
    return known.length ? known.reduce( ( total, value ) => total + value, 0 ) / known.length : null;
  }
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

export const renderizarKdrMedioLobby = ( room, media ) => {
  const title = room.querySelector( '.LobbyRoom__title' );
  if ( !title ) { return; }

  let mediaElement = room.querySelector( '.gcbooster-kdr-media' );
  if ( !mediaElement ) {
    mediaElement = room.ownerDocument.createElement( 'div' );
    mediaElement.className = 'gcbooster-kdr-media';
    mediaElement.style.cssText = 'font-size:11px;font-weight:600;color:#f39c12;';
    title.insertAdjacentElement( 'afterend', mediaElement );
  }

  const attributes = { gcbooster_kdr_medio: media.toFixed( 2 ), gcbooster_lobby_title: normalizarTituloLobby( title.innerText ) };
  for ( const [ name, value ] of Object.entries( attributes ) ) {
    if ( mediaElement.getAttribute( name ) !== value ) { mediaElement.setAttribute( name, value ); }
  }

  const mediaText = `KDR Médio: ${media.toFixed( 2 )}`;
  if ( mediaElement.textContent !== mediaText ) {
    mediaElement.textContent = mediaText;
  }
};


const obterMediaKdrPorTitulo = ( title, doc ) => {
  const tituloNormalizado = normalizarTituloLobby( title );
  if ( !tituloNormalizado ) { return null; }

  const mediaElements = doc.querySelectorAll( '[gcbooster_kdr_medio][gcbooster_lobby_title]' );

  return Array.from( mediaElements ).find( element => {
    return normalizarTituloLobby( element.getAttribute( 'gcbooster_lobby_title' ) ) === tituloNormalizado;
  } ) || null;
};

export const atualizarMediasDesafios = ( doc, { enabled = false, min = 0, max = 2 } = {} ) => {
  const challengesList = doc.querySelector( '.ChallengesList__list' );
  if ( !challengesList ) { return []; }

  const items = challengesList.querySelectorAll( '.LobbyChallengeCard__item' );

  items.forEach( item => {
    const info = item.querySelector( '.LobbyChallengeCard__info' );
    const titleElement = info?.querySelector( 'p' );
    const title = normalizarTituloLobby( titleElement?.textContent );
    const mediaElement = obterMediaKdrPorTitulo( title, doc );
    const media = Number.parseFloat( mediaElement?.getAttribute( 'gcbooster_kdr_medio' ) );

    const rejected = enabled && !Number.isNaN( media ) && ( media < min || ( max < 2 && media > max ) );
    item.classList.toggle( 'gcb-kdr-challenge-hidden', rejected );
    if ( !info || !titleElement || Number.isNaN( media ) ) {
      return;
    }

    let wrapper = info.querySelector( '.gcbooster-kdr-wrapper' );
    if ( !wrapper ) {
      wrapper = doc.createElement( 'div' );
      wrapper.className = 'gcbooster-kdr-wrapper';
      wrapper.style.cssText = 'display:flex;flex-direction:column;gap:0;';
      titleElement.insertAdjacentElement( 'beforebegin', wrapper );
      wrapper.appendChild( titleElement );
    }

    let kdrElement = wrapper.querySelector( '.gcbooster-kdr' );
    if ( !kdrElement ) {
      kdrElement = doc.createElement( 'span' );
      kdrElement.className = 'gcbooster-kdr';
      kdrElement.style.cssText = 'font-size:9px;color:orange;';
      wrapper.appendChild( kdrElement );
    }

    const textoKdr = `KDR Medio: ${media.toFixed( 2 )}`;
    if ( kdrElement.textContent !== textoKdr ) {
      kdrElement.textContent = textoKdr;
    }


  } );
  return Array.from( items );
};

