import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { harness, room, listing, player } from './helpers.mjs';
import { calcularKdrMedioLobby, renderizarKdrMedioLobby } from '../src/content-scripts/lobby/filtrarKdr.js';

test( 'official and clean builds: same mean, markup and styles in a shared fixture', () => {
  const reference = '11b4e5aced81c93f9002ea37508b9d923925db00:src/content-scripts/lobby/filtrarKdr.js';
  const official = execFileSync( 'git', [ 'show', reference ], { encoding: 'utf8' } );
  const code = official.slice( official.indexOf( 'const calcularKdrMedioLobby' ), official.indexOf( 'const aplicarFiltroDesafios' ) );
  const html = room( 1, [ 1.1, 1.2, 1.05 ] ).replace( '</article>',
    '<span gcbooster_kdr_lobby="1" kdr="1.10"></span><span gcbooster_kdr_lobby="1" kdr="1.20"></span>' +
    '<span gcbooster_kdr_lobby="1" kdr="1.05"></span></article>' );
  const original = new JSDOM( html );
  const modified = new JSDOM( html );
  try {
    const context = vm.createContext( { document: original.window.document } );
    vm.runInContext( `const normalizarTituloLobby = title => title?.trim() || ''; ${code}
      const room = document.querySelector('[id^="roomCardWrapper-"]');
      renderizarKdrMedioLobby(room, calcularKdrMedioLobby(room));`, context );
    const card = modified.window.document.querySelector( '[id^="roomCardWrapper-"]' );
    renderizarKdrMedioLobby( card, calcularKdrMedioLobby( card ) );
    assert.equal( card.outerHTML, original.window.document.querySelector( '[id^="roomCardWrapper-"]' ).outerHTML );
  } finally { original.window.close(); modified.window.close(); }
} );

test( 'mean and individual badges survive filters, reset, and controller teardown', async () => {
  const h = await harness();
  try {
    const card = h.document.getElementById( 'roomCardWrapper-1' );
    const average = card.querySelector( '.gcbooster-kdr-media' );
    assert.equal( average.textContent, 'KDR Médio: 1.25' );
    card.querySelector( '.LobbyPlayerVertical' ).insertAdjacentHTML( 'beforeend', '<span id="gcbooster_kdr">1.20</span>' );
    const badge = card.querySelector( '#gcbooster_kdr' );
    for ( let i = 0; i < 4; i++ ) {
      await h.input( 'averageEnabled', true );
      await h.input( 'individualEnabled', true );
      await h.input( 'averageEnabled', false );
      await h.input( 'individualEnabled', false );
      assert.equal( card.querySelector( '.gcbooster-kdr-media' ), average );
      assert.equal( card.querySelector( '#gcbooster_kdr' ), badge );
    }
    h.controller.destroy();
    assert.equal( average.isConnected, true );
    assert.equal( badge.isConnected, true );
  } finally { h.close(); }
} );

test( 'known skeleton stays in layout, then automatically becomes an evaluated card', async () => {
  const skeleton = '<div id="roomCardWrapper-2"><article class="CardSkeleton" style="height:240px"></article></div>';
  const h = await harness( listing( room( 1, [ 1.2 ] ) + skeleton ) );
  try {
    await h.input( 'individualEnabled', true );
    assert.equal( h.hidden( 2 ), false );
    const card = h.document.getElementById( 'roomCardWrapper-2' );
    assert.equal( card.hasAttribute( 'data-gcb-kdr-status' ), false );
    assert.equal( JSON.parse( h.document.getElementById( 'gcb-kdr-filters' ).dataset.counts ).loading, 1 );
    card.innerHTML = `<article class="LobbyRoom"><h3 class="LobbyRoom__title">Sala</h3>
      <div class="LobbyRoom__lineup">${player( 88, 0.6 )}</div></article>`;
    await h.tick();
    assert.equal( h.hidden( 2 ), true );
    assert.equal( card.querySelector( '.gcbooster-kdr-media' ).textContent, 'KDR Médio: 0.60' );
    await h.input( 'individualEnabled', false );
    assert.equal( h.hidden( 2 ), false );
  } finally { h.close(); }
} );
