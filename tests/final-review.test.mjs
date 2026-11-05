import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { harness, listing, room } from './helpers.mjs';
import { atualizarMediasDesafios } from '../src/content-scripts/lobby/filtrarKdr.js';

test( 'supplied sanitized fixture: short counts, skeleton separate, badges preserved', async () => {
  const html = readFileSync( new URL( './fixtures/gamersclub-sanitized.html', import.meta.url ), 'utf8' );
  const h = await harness( html.replace( '<body>', '<body><div id="gc-ext-wrapper"></div>' ) );
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

test( 'legacy challenge maximum: equality and sentinel 2 or higher', () => {
  const dom = new JSDOM( `<div gcbooster_kdr_medio="1.50" gcbooster_lobby_title="A"></div>
    <div class="ChallengesList__list"><div class="LobbyChallengeCard__item">
    <div class="LobbyChallengeCard__info"><p>A</p></div></div></div>` );
  const doc = dom.window.document;
  const item = doc.querySelector( '.LobbyChallengeCard__item' );
  try {
    atualizarMediasDesafios( doc, { enabled: true, min: 1, max: 1.5 } );
    assert.equal( item.classList.contains( 'gcb-kdr-challenge-hidden' ), false );
    doc.querySelector( '[gcbooster_kdr_medio]' ).setAttribute( 'gcbooster_kdr_medio', '2.50' );
    for ( const max of [ 2, 3 ] ) {
      atualizarMediasDesafios( doc, { enabled: true, min: 1, max } );
      assert.equal( item.classList.contains( 'gcb-kdr-challenge-hidden' ), false );
    }
    atualizarMediasDesafios( doc, { enabled: true, min: 1, max: 1.99 } );
    assert.equal( item.classList.contains( 'gcb-kdr-challenge-hidden' ), true );
  } finally { dom.window.close(); }
} );

test( 'legacy challenge maximum: saved value, storage updates and reset preserve behavior', async () => {
  const html = listing( room( 1, [ 1.2, 1.3 ] ) ) + `<div class="ChallengesList__list">
    <div class="LobbyChallengeCard__item"><div class="LobbyChallengeCard__info"><p>Sala 1</p></div></div></div>`;
  const h = await harness( html, { filtrarKdrMedioLobbyMax: 1.2 } );
  try {
    h.document.querySelector( '.LobbyRoom__title' ).innerText = 'Sala 1';
    const item = h.document.querySelector( '.LobbyChallengeCard__item' );
    const hidden = () => item.classList.contains( 'gcb-kdr-challenge-hidden' );
    await h.input( 'averageEnabled', true );
    assert.equal( hidden(), true );
    assert.equal( h.hidden( 1 ), false, 'legacy maximum does not restrict the lobby filter' );
    await new Promise( resolve => h.storage.sync.set( { filtrarKdrMedioLobbyMax: 1.25 }, resolve ) );
    await h.tick();
    assert.equal( hidden(), false );
    await new Promise( resolve => h.storage.sync.set( { filtrarKdrMedioLobbyMax: 1.24 }, resolve ) );
    await h.tick();
    assert.equal( hidden(), true );
    h.document.querySelector( '[data-action="reset"]' ).click();
    await h.tick();
    assert.equal( hidden(), false );
    assert.equal( h.data.filtrarKdrMedioLobbyMax, 1.24 );
    await h.input( 'individualEnabled', true );
    assert.equal( hidden(), false, 'individual filter alone does not filter challenges' );
    await h.input( 'averageEnabled', true );
    assert.equal( hidden(), true );
  } finally { h.close(); }
} );

test( 'diagnostic distinguishes Booster average from published average across reprocessing', async () => {
  const h = await harness();
  try {
    const source = () => JSON.parse( h.document.getElementById( 'gcb-kdr-filters' ).dataset.diagnostics )[0].averageSource;
    await h.input( 'averageEnabled', true );
    assert.equal( source(), 'booster-derived' );
    await h.input( 'averageMin', '1.05' );
    assert.equal( source(), 'booster-derived' );
    h.document.getElementById( 'roomCardWrapper-1' ).setAttribute( 'data-average-kdr', '1.10' );
    await h.tick();
    assert.equal( source(), 'published' );
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
