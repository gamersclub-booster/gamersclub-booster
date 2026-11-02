import test from 'node:test';
import assert from 'node:assert/strict';
import { harness, listing, room } from './helpers.mjs';
import { DEFAULTS, evaluateLobby } from '../src/lib/kdr/rules.mjs';

test( 'comparação inclusiva usa a precisão exibida, em ambos os filtros', () => {
  const preferences = { ...DEFAULTS, averageEnabled: true, individualEnabled: true, averageMin: 1.2, individualMin: 1.2 };
  const lobby = { average: 1.199999999, players: [ { kdr: 1.199 } ] };
  assert.equal( evaluateLobby( lobby, preferences ), 'visible' );
  assert.equal( evaluateLobby( { ...lobby, average: 1.194 }, preferences ), 'hidden' );
  assert.equal( evaluateLobby( { ...lobby, players: [ { kdr: null } ] }, preferences ), 'pending' );
} );

test( 'diagnóstico técnico distingue dados ausentes, carregamento e transições automáticas', async () => {
  const h = await harness( listing( room( 1, [ null ] ) ) );
  try {
    await h.input( 'individualEnabled', true );
    const card = h.document.getElementById( 'roomCardWrapper-1' );
    const slot = card.querySelector( '.LobbyPlayerVertical' );
    assert.equal( card.dataset.gcbKdrReasons, 'individual_kdr_unavailable' );
    slot.setAttribute( 'aria-busy', 'true' );
    await h.tick();
    assert.equal( card.dataset.gcbKdrReasons, 'loading' );
    slot.removeAttribute( 'aria-busy' );
    slot.setAttribute( 'title', 'KDR: <b>1,00</b>| Level: 20' );
    await h.tick();
    assert.equal( h.hidden( 1 ), false );
    slot.setAttribute( 'title', 'KDR 0.99' );
    await h.tick();
    assert.equal( h.hidden( 1 ), true );
    const diagnostics = JSON.parse( h.document.getElementById( 'gcb-kdr-filters' ).dataset.diagnostics );
    assert.equal( diagnostics[0].status, 'hidden' );
  } finally { h.close(); }
} );

test( 'skeleton cosmético não invalida tooltip válido; filtros desligados não alteram cards', async () => {
  const h = await harness();
  try {
    const slot = h.document.querySelector( '.LobbyPlayerVertical' );
    slot.insertAdjacentHTML( 'beforeend', '<span class="skeleton">Avatar</span>' );
    await h.input( 'individualEnabled', true );
    assert.equal( h.hidden( 1 ), false );
    await h.input( 'individualEnabled', false );
    const card = h.document.getElementById( 'roomCardWrapper-1' );
    assert.equal( card.hasAttribute( 'data-gcb-kdr-status' ), false );
    assert.ok( card.querySelector( '.gcbooster-kdr-media' ) );
    assert.equal( card.className, '' );
  } finally { h.close(); }
} );

test( 'diagnóstico diferencia roster vazio de estrutura não reconhecida', async () => {
  const h = await harness( listing( room( 1, [] ) + '<article id="roomCardWrapper-2"></article>' ) );
  try {
    await h.input( 'individualEnabled', true );
    assert.equal( h.document.getElementById( 'roomCardWrapper-1' ).dataset.gcbKdrReasons, 'empty_roster' );
    assert.equal( h.document.getElementById( 'roomCardWrapper-2' ).dataset.gcbKdrReasons, 'structure_unrecognized' );
  } finally { h.close(); }
} );
