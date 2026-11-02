import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { harness } from './helpers.mjs';
import { atualizarMediasDesafios } from '../src/content-scripts/lobby/filtrarKdr.js';

test( 'supplied sanitized fixture: short counts, skeleton separate, badges preserved', async () => {
  const html = readFileSync( new URL( './fixtures/gamersclub-sanitized.html', import.meta.url ), 'utf8' );
  const h = await harness( html );
  try {
    const panel = h.document.getElementById( 'gcb-kdr-filters' );
    const summary = panel.querySelector( '.gcb-kdr-count' );
    assert.equal( panel.querySelector( '.gcb-kdr-hint' ), null );
    assert.equal( summary.hidden, true );
    assert.equal( h.document.querySelectorAll( '.gcbooster-kdr-media' ).length, 1 );
    assert.equal( h.document.querySelectorAll( '[gcbooster_kdr_lobby]' ).length, 4 );
    await h.input( 'individualEnabled', true );
    assert.equal( summary.textContent, '0 salas exibidas · 1 ocultada' );
    const counts = JSON.parse( panel.dataset.counts );
    assert.equal( counts.rendered, 1 );
    assert.equal( counts.loading, 1 );
    const diagnostics = JSON.parse( panel.dataset.diagnostics );
    assert.ok( diagnostics.some( item => item.reasons.includes( 'card_skeleton' ) ) );
    assert.equal( h.document.getElementById( 'roomCardWrapper-exemplo-skeleton' ).className, 'styles_cardWrapper__9F3Cu' );
    await h.input( 'individualEnabled', false );
    assert.equal( summary.hidden, true );
    assert.equal( h.document.querySelectorAll( '[gcbooster_kdr_lobby]' ).length, 4 );
    assert.equal( h.document.querySelectorAll( '.gcbooster-kdr-media' ).length, 1 );
  } finally { h.close(); }
} );

test( 'challenge mean filtering restored: inclusive min, legacy max, disabled restoration', () => {
  const dom = new JSDOM( `<div gcbooster_kdr_medio="1.00" gcbooster_lobby_title="A"></div>
    <div class="ChallengesList__list"><div class="LobbyChallengeCard__item" style="display:flex">
    <div class="LobbyChallengeCard__info"><p>A</p></div></div></div>` );
  const doc = dom.window.document;
  const item = doc.querySelector( '.LobbyChallengeCard__item' );
  try {
    atualizarMediasDesafios( doc, { enabled: true, min: 1.05 } );
    assert.equal( item.classList.contains( 'gcb-kdr-challenge-hidden' ), true );
    atualizarMediasDesafios( doc, { enabled: true, min: 1 } );
    assert.equal( item.classList.contains( 'gcb-kdr-challenge-hidden' ), false );
    atualizarMediasDesafios( doc, { enabled: true, min: 0, max: 0.95 } );
    assert.equal( item.classList.contains( 'gcb-kdr-challenge-hidden' ), true );
    atualizarMediasDesafios( doc );
    assert.equal( item.classList.contains( 'gcb-kdr-challenge-hidden' ), false );
    assert.equal( item.style.display, 'flex' );
    assert.equal( item.querySelectorAll( '.gcbooster-kdr' ).length, 1 );
    assert.equal( item.querySelector( '.gcbooster-kdr' ).textContent, 'KDR Medio: 1.00' );
  } finally { dom.window.close(); }
} );
