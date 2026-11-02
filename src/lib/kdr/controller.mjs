import { DEFAULTS, STORAGE_KEYS, parseThreshold, stepThreshold, preferencesFromStorage, evaluateLobby, pendingReasons } from './rules.mjs';
import { calcularKdrMedioLobby, renderizarKdrMedioLobby, atualizarMediasDesafios } from '../../content-scripts/lobby/filtrarKdr.js';
import { LIST_SELECTOR, ROOM_SELECTOR, readLobby } from './dom.mjs';

const PANEL_ID = 'gcb-kdr-filters';
const PENDING_CLASS = 'gcb-kdr-pending';
const HIDDEN_CLASS = 'gcb-kdr-filter-hidden';
const VISIBLE_CLASS = 'gcb-kdr-filter-visible';
const ACTIVE_CLASS = 'gcb-kdr-filter-active';
const WATCH_OPTIONS = {
  childList: true,
  subtree: true,
  characterData: true,
  attributes: true,
  attributeFilter: [ 'title', 'data-tip-text', 'href', 'id', 'class', 'data-kdr', 'data-value', 'data-stat',
    'data-player-id', 'data-playerid', 'src', 'aria-busy', 'data-loading', 'gcbooster_kdr_medio', 'data-average-kdr' ]
};

export function createKdrFilters( { document, window, storage, runtime } ) {
  let preferences = { ...DEFAULTS };
  let panel = null;
  let list = null;
  let frame = null;
  let saveTimer = null;
  let destroyed = false;
  let challengeMax = 2;
  let challengeItems = [];
  let dirty = {};
  const touched = new Set();
  const identities = new WeakMap();
  const observer = new window.MutationObserver( mutations => {
    const relevant = mutations.some( mutation => {
      const target = mutation.target.nodeType === 1 ? mutation.target : mutation.target.parentElement;
      if ( target?.closest( `#${PANEL_ID}` ) ) { return false; }
      if ( target === list || target?.closest( `${LIST_SELECTOR}, .ChallengesList__list` ) ) { return true; }
      return [ ...mutation.addedNodes, ...mutation.removedNodes ].some( node => node.nodeType === 1 &&
        ( node.matches( `${LIST_SELECTOR}, .ChallengesList__list` ) ||
          node.querySelector( `${LIST_SELECTOR}, .ChallengesList__list` ) || node.id === PANEL_ID ) );
    } );
    if ( relevant ) { schedule(); }
  } );

  function schedule() {
    if ( destroyed || frame !== null ) { return; }
    frame = window.requestAnimationFrame( () => {
      frame = null;
      apply();
    } );
  }

  function setText( node, value ) {
    if ( node && node.textContent !== value ) { node.textContent = value; }
  }

  function setAttribute( node, name, value ) {
    if ( node.getAttribute( name ) !== value ) { node.setAttribute( name, value ); }
  }

  function flush() {
    window.clearTimeout( saveTimer );
    saveTimer = null;
    if ( !Object.keys( dirty ).length ) { return; }
    const pending = dirty;
    dirty = {};
    storage.sync.set( pending, () => {
      if ( runtime?.lastError ) {
        dirty = { ...pending, ...dirty };
        setText( panel?.querySelector( '.gcb-kdr-storage' ), 'Não foi possível salvar. Altere um filtro para tentar novamente.' );
      } else {
        setText( panel?.querySelector( '.gcb-kdr-storage' ), '' );
      }
    } );
  }

  function updatePreference( field, value ) {
    if ( preferences[field] === value ) { return; }
    preferences[field] = value;
    dirty[STORAGE_KEYS[field]] = value;
    window.clearTimeout( saveTimer );
    saveTimer = window.setTimeout( flush, 250 );
    schedule();
  }

  function syncControls() {
    if ( !panel ) { return; }
    for ( const field of Object.keys( DEFAULTS ) ) {
      const input = panel.querySelector( `[name="${field}"]` );
      if ( input.type === 'checkbox' ) {
        input.checked = preferences[field];
      } else if ( document.activeElement !== input ) {
        input.value = preferences[field].toFixed( 2 );
        input.setCustomValidity( '' );
        input.removeAttribute( 'aria-invalid' );
      }
    }
  }

  function mountPanel() {
    panel?.remove();
    document.getElementById( PANEL_ID )?.remove();
    panel = document.createElement( 'section' );
    panel.id = PANEL_ID;
    panel.setAttribute( 'aria-label', 'Filtros de KDR do GamersClub Booster' );
    const control = ( field, label ) => `
      <div class="gcb-kdr-group"><label><input type="checkbox" name="${field}Enabled">${label}</label>
        <div class="gcb-kdr-stepper" role="group" aria-label="Mínimo: ${label}">
          <button type="button" data-step="-1" data-field="${field}Min" aria-label="Diminuir mínimo: ${label}">−</button>
          <input name="${field}Min" type="text" inputmode="decimal" aria-label="KDR mínimo: ${label}"
            title="KDR maior ou igual ao mínimo. Digite com ponto ou vírgula." autocomplete="off" size="5">
          <button type="button" data-step="1" data-field="${field}Min" aria-label="Aumentar mínimo: ${label}">+</button>
        </div></div>`;
    panel.innerHTML = `
      <div class="gcb-kdr-controls"><strong>KDR</strong>${control( 'average', 'Média do lobby' )}
        ${control( 'individual', 'Todos os jogadores' )}
        <button type="button" data-action="reset">Restaurar padrão</button></div>
      <div class="gcb-kdr-footer">
        <span class="gcb-kdr-count" role="status" aria-live="polite" aria-atomic="true"></span></div>
      <p class="gcb-kdr-empty" hidden>Nenhum lobby atende aos filtros configurados.</p>
      <p class="gcb-kdr-storage" role="status"></p>`;
    list.insertAdjacentElement( 'beforebegin', panel );
    panel.addEventListener( 'input', event => {
      const input = event.target;
      const field = input.name;
      if ( !Object.hasOwn( DEFAULTS, field ) ) { return; }
      if ( input.type === 'checkbox' ) {
        updatePreference( field, input.checked );
        flush();
      } else {
        const value = parseThreshold( input.value );
        input.setCustomValidity( value === null ? 'Informe um mínimo decimal entre 0 e 100.' : '' );
        input.setAttribute( 'aria-invalid', String( value === null ) );
        if ( value !== null ) { updatePreference( field, value ); }
      }
    } );
    panel.addEventListener( 'change', flush );
    panel.addEventListener( 'focusout', event => {
      const input = event.target;
      if ( input.type !== 'text' ) { return; }
      const value = parseThreshold( input.value );
      if ( value !== null ) {
        input.value = value.toFixed( 2 );
        updatePreference( input.name, Number( input.value ) );
      }
      flush();
    } );
    function step( field, direction ) {
      const input = panel.querySelector( `[name="${field}"]` );
      const value = stepThreshold( parseThreshold( input.value ) ?? preferences[field], direction );
      input.value = value.toFixed( 2 );
      input.setCustomValidity( '' );
      input.removeAttribute( 'aria-invalid' );
      updatePreference( field, value );
      flush();
    }
    panel.addEventListener( 'keydown', event => {
      if ( event.target.type !== 'text' || ![ 'ArrowUp', 'ArrowDown' ].includes( event.key ) ) { return; }
      event.preventDefault();
      step( event.target.name, event.key === 'ArrowUp' ? 1 : -1 );
    } );
    panel.addEventListener( 'click', event => {
      const button = event.target.closest( 'button' );
      if ( button?.dataset.step ) { step( button.dataset.field, Number( button.dataset.step ) ); }
      const action = button?.dataset.action;
      if ( action === 'reset' ) {
        for ( const [ field, value ] of Object.entries( DEFAULTS ) ) {
          updatePreference( field, value );
          dirty[STORAGE_KEYS[field]] = value;
        }
        syncControls();
        flush();
      }
    } );
    syncControls();
  }

  function apply() {
    if ( destroyed ) { return; }
    // Ignore our own UI/visibility mutations, with no observer feedback loop.
    observer.disconnect();
    const nextList = document.querySelector( LIST_SELECTOR );
    if ( list && list !== nextList ) { list.classList.remove( ACTIVE_CLASS ); }
    list = nextList;
    for ( const room of touched ) {
      if ( !room.isConnected || !list?.contains( room ) ) {
        room.removeAttribute( 'data-gcb-kdr-status' );
        room.removeAttribute( 'data-gcb-kdr-reasons' );
        room.classList.remove( HIDDEN_CLASS, PENDING_CLASS );
        room.classList.remove( VISIBLE_CLASS );
        touched.delete( room );
      }
    }
    if ( !list ) {
      for ( const item of challengeItems ) { item.classList.remove( 'gcb-kdr-challenge-hidden' ); }
      challengeItems = [];
      panel?.remove();
      panel = null;
    } else {
      const active = preferences.averageEnabled || preferences.individualEnabled;
      list.classList.toggle( ACTIVE_CLASS, active );
      if ( !panel?.isConnected || panel.nextElementSibling !== list ) { mountPanel(); }
      const counts = { visible: 0, hidden: 0, pending: 0, loading: 0 };
      const diagnostics = [];
      for ( const room of list.querySelectorAll( ROOM_SELECTOR ) ) {
        const skeleton = !!room.querySelector( 'article.CardSkeleton' );
        // Keep the wrapper in layout: the platform may wait for intersection.
        if ( skeleton ) {
          counts.loading++;
          room.classList.remove( HIDDEN_CLASS, PENDING_CLASS, VISIBLE_CLASS );
          room.removeAttribute( 'data-gcb-kdr-status' );
          room.removeAttribute( 'data-gcb-kdr-reasons' );
          touched.add( room );
          diagnostics.push( { room: room.id, status: 'loading', reasons: [ 'card_skeleton' ] } );
          continue;
        }
        // Display remains active independently of optional filtering.
        const lobby = readLobby( room, identities );
        const published = room.hasAttribute( 'data-average-kdr' ) || room.querySelector( '[data-average-kdr], [data-stat="average-kdr"]' );
        const values = lobby.players.map( player => player.kdr );
        const displayedMean = published ? lobby.average : calcularKdrMedioLobby( room, values.some( value => value !== null ) ? values : null );
        if ( displayedMean !== null ) { renderizarKdrMedioLobby( room, displayedMean ); }
        // The filter never approves a partial mean displayed during loading.
        const complete = lobby.rosterComplete && lobby.players.every( player => player.kdr !== null );
        lobby.average = published || complete ? displayedMean : null;
        const status = evaluateLobby( lobby, preferences );
        counts[status]++;
        const reasons = active ? pendingReasons( lobby, preferences ) : [];
        if ( active ) {
          setAttribute( room, 'data-gcb-kdr-status', status );
          setAttribute( room, 'data-gcb-kdr-reasons', reasons.join( ',' ) );
          diagnostics.push( {
            room: room.id, status, reasons, players: lobby.players.length,
            average: lobby.average, averageSource: lobby.nativeAverage ? 'published' : 'booster-derived'
          } );
        } else {
          room.removeAttribute( 'data-gcb-kdr-status' );
          room.removeAttribute( 'data-gcb-kdr-reasons' );
        }
        room.classList.toggle( HIDDEN_CLASS, status === 'hidden' );
        room.classList.toggle( PENDING_CLASS, status === 'pending' );
        room.classList.toggle( VISIBLE_CLASS, active && status === 'visible' );
        touched.add( room );

      }
      for ( const item of challengeItems ) {
        if ( !item.isConnected || !item.closest( '.ChallengesList__list' ) ) { item.classList.remove( 'gcb-kdr-challenge-hidden' ); }
      }
      challengeItems = atualizarMediasDesafios( document, {
        enabled: preferences.averageEnabled, min: Number( preferences.averageMin.toFixed( 2 ) ), max: challengeMax
      } );
      setAttribute( panel, 'data-diagnostics', JSON.stringify( diagnostics ) );
      setAttribute( panel, 'data-counts', JSON.stringify( { ...counts, rendered: counts.visible + counts.hidden + counts.pending } ) );
      const shownText = counts.visible === 1 ? '1 sala exibida' : `${counts.visible} salas exibidas`;
      const hiddenText = counts.hidden === 1 ? '1 ocultada' : `${counts.hidden} ocultadas`;
      setText( panel.querySelector( '.gcb-kdr-count' ), `${shownText} · ${hiddenText}` );
      panel.querySelector( '.gcb-kdr-count' ).hidden = !active;
      panel.querySelector( '.gcb-kdr-footer' ).hidden = !active;
      panel.querySelector( '.gcb-kdr-empty' ).hidden = counts.visible > 0 ||
        ( !preferences.averageEnabled && !preferences.individualEnabled );
    }
    observer.observe( document.body, WATCH_OPTIONS );
  }

  function onStorageChanged( changes, area ) {
    if ( area !== 'sync' ) { return; }
    if ( Object.hasOwn( changes, 'filtrarKdrMedioLobbyMax' ) ) {
      challengeMax = parseThreshold( changes.filtrarKdrMedioLobbyMax.newValue ) ?? 2;
      schedule();
    }
    let changed = false;
    for ( const [ field, key ] of Object.entries( STORAGE_KEYS ) ) {
      if ( !Object.hasOwn( changes, key ) ) { continue; }
      // A write acknowledgement must not overwrite a newer, unsaved edit.
      if ( Object.hasOwn( dirty, key ) ) { continue; }
      preferences[field] = preferencesFromStorage( { [key]: changes[key].newValue } )[field];
      changed = true;
    }
    if ( changed ) { syncControls(); schedule(); }
  }

  function destroy() {
    destroyed = true;
    flush();
    observer.disconnect();
    if ( frame !== null ) { window.cancelAnimationFrame( frame ); }
    storage.onChanged.removeListener( onStorageChanged );
    window.removeEventListener( 'pagehide', onPageHide );
    list?.classList.remove( ACTIVE_CLASS );
    for ( const room of touched ) {
      room.removeAttribute( 'data-gcb-kdr-status' );
      room.removeAttribute( 'data-gcb-kdr-reasons' );
      room.classList.remove( HIDDEN_CLASS, PENDING_CLASS );
      room.classList.remove( VISIBLE_CLASS );
    }
    touched.clear();
    for ( const item of challengeItems ) { item.classList.remove( 'gcb-kdr-challenge-hidden' ); }
    panel?.remove();
  }

  function onPageHide( event ) {
    flush();
    if ( !event.persisted ) { destroy(); }
  }

  async function start() {
    const stored = await new Promise( resolve => storage.sync.get( [ ...Object.values( STORAGE_KEYS ), 'filtrarKdrMedioLobbyMax' ], value => {
      if ( runtime?.lastError ) { resolve( {} ); } else { resolve( value ); }
    } ) );
    if ( destroyed ) { return; }
    challengeMax = parseThreshold( stored.filtrarKdrMedioLobbyMax ) ?? 2;
    preferences = preferencesFromStorage( stored );
    storage.onChanged.addListener( onStorageChanged );
    window.addEventListener( 'pagehide', onPageHide );
    apply();
  }

  return { start, destroy };
}
