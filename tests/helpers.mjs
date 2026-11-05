import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createKdrFilters } from '../src/lib/kdr/controller.mjs';

export const player = ( id, kdr ) => `<a class="LobbyPlayerVertical" href="/jogador/${id}" ${
  kdr === null ? '' : `title="Jogador ${id} KDR: ${kdr} Level: 20"`}>Jogador ${id}</a>`;
export const room = ( id, values ) => `<div id="roomCardWrapper-${id}"><article class="LobbyRoom"><h3 class="LobbyRoom__title">Sala ${id}</h3>
  <div class="LobbyRoom__lineup" id="lobby-${id}">${values.map( ( kdr, index ) => player( index + 1, kdr ) ).join( '' )}</div>
  <button class="join">Entrar</button></article></div>`;
export const listing = content => `<div id="gc-ext-wrapper"></div><div id="lobby-filters-container">Filtros GC</div>
  <div id="lobbies-wrapper">${content}</div>`;

export function fakeStorage( initial = {} ) {
  const data = { ...initial };
  const listeners = new Set();
  const storage = {
    sync: {
      get: ( _keys, callback ) => queueMicrotask( () => callback( { ...data } ) ),
      set: ( values, callback = () => {} ) => queueMicrotask( () => {
        const changes = {};
        for ( const [ key, value ] of Object.entries( values ) ) {
          changes[key] = { oldValue: data[key], newValue: value };
          data[key] = value;
        }
        for ( const listener of listeners ) { listener( changes, 'sync' ); }
        callback();
      } )
    },
    onChanged: {
      addListener: listener => listeners.add( listener ),
      removeListener: listener => listeners.delete( listener )
    }
  };
  return { storage, data, listeners };
}

export async function harness( html = listing( room( 1, [ 1.2, 1.3 ] ) ), stored = {} ) {
  const dom = new JSDOM( html, { url: 'https://gamersclub.com.br/lobby', pretendToBeVisual: true } );
  const { window } = dom;
  const { document } = window;
  const frames = new Map();
  let sequence = 0;
  let runs = 0;
  window.requestAnimationFrame = callback => { frames.set( ++sequence, callback ); return sequence; };
  window.cancelAnimationFrame = id => frames.delete( id );
  const mock = fakeStorage( stored );
  const controller = createKdrFilters( { document, window, storage: mock.storage, runtime: {} } );
  await controller.start();
  async function tick() {
    for ( let attempt = 0; attempt < 8; attempt++ ) {
      await Promise.resolve();
      await Promise.resolve();
      if ( !frames.size ) { return; }
      const callbacks = [ ...frames.values() ];
      frames.clear();
      for ( const callback of callbacks ) { runs++; callback(); }
    }
    assert.fail( 'MutationObserver feedback loop' );
  }
  async function input( field, value ) {
    const node = document.querySelector( `[name="${field}"]` );
    if ( node.type === 'checkbox' ) { node.checked = value; } else { node.value = value; }
    node.dispatchEvent( new window.Event( 'input', { bubbles: true } ) );
    node.dispatchEvent( new window.Event( 'change', { bubbles: true } ) );
    await tick();
    return node;
  }
  const hidden = id => document.getElementById( `roomCardWrapper-${id}` ).matches( '.gcb-kdr-filter-hidden, .gcb-kdr-pending' );
  const close = () => { controller.destroy(); window.close(); };
  return { ...mock, dom, document, window, controller, tick, input, hidden, close, runs: () => runs };
}
