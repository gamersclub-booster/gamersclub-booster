import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { harness, room, listing, player } from './helpers.mjs';
import { calcularKdrMedioLobby, renderizarKdrMedioLobby } from '../src/content-scripts/lobby/filtrarKdr.js';

test( 'official reference: same mean, markup, placement and styles without Git history', () => {
  const reference = JSON.parse( readFileSync( new URL( './fixtures/official-average-reference.json', import.meta.url ), 'utf8' ) );
  const badges = reference.values.map( value => `<span gcbooster_kdr_lobby="1" kdr="${value}"></span>` ).join( '' );
  const dom = new JSDOM( room( 1, reference.values ).replace( '</article>', `${badges}</article>` ) );
  try {
    const card = dom.window.document.querySelector( '[id^="roomCardWrapper-"]' );
    const title = card.querySelector( '.LobbyRoom__title' );
    title.innerText = title.textContent; // jsdom has no layout-backed innerText.
    const before = card.outerHTML;
    const mean = calcularKdrMedioLobby( card );
    assert.equal( mean, reference.expectedMean );
    renderizarKdrMedioLobby( card, mean );
    const badge = card.querySelector( '.gcbooster-kdr-media' );
    assert.equal( badge.outerHTML, reference.indicatorHTML );
    assert.equal( title.nextElementSibling, badge );
    renderizarKdrMedioLobby( card, mean );
    assert.equal( card.querySelectorAll( '.gcbooster-kdr-media' ).length, 1 );
    const copy = card.cloneNode( true );
    copy.querySelector( '.gcbooster-kdr-media' ).remove();
    assert.equal( copy.outerHTML, before );
  } finally { dom.window.close(); }
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
