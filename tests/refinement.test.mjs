import test from 'node:test';
import assert from 'node:assert/strict';
import { harness, listing, room } from './helpers.mjs';
import { stepThreshold, parseThreshold, STORAGE_KEYS } from '../src/lib/kdr/rules.mjs';
import { bindKdrOptions } from '../src/lib/kdr/options.mjs';

test( 'incrementos exatos, limites e validação', () => {
  let value = 1;
  for ( let i = 0; i < 20; i++ ) { value = stepThreshold( value, 1 ); }
  assert.equal( value, 2 );
  assert.equal( stepThreshold( 0, -1 ), 0 );
  assert.equal( stepThreshold( 100, 1 ), 100 );
  assert.equal( parseThreshold( '100.01' ), null );
  assert.equal( parseThreshold( '1,05' ), 1.05 );
} );

test( 'stepper, teclado, foco e entrada manual sem sobrescrita durante edição', async () => {
  const h = await harness();
  try {
    const input = h.document.querySelector( '[name="individualMin"]' );
    h.document.querySelector( '[data-field="individualMin"][data-step="1"]' ).click();
    await h.tick();
    assert.equal( input.value, '1.05' );
    assert.equal( h.data[STORAGE_KEYS.individualMin], 1.05 );
    input.focus();
    input.dispatchEvent( new h.window.KeyboardEvent( 'keydown', { key: 'ArrowDown', bubbles: true } ) );
    await h.tick();
    assert.equal( input.value, '1.00' );
    await h.input( 'individualMin', '1,2' );
    assert.equal( h.document.activeElement, input );
    assert.equal( input.value, '1,2' );
    input.blur();
    assert.equal( input.value, '1.20' );
  } finally { h.close(); }
} );

test( 'popup e página compartilham storage sem ciclos de escrita', async () => {
  const h = await harness();
  const popup = h.document.createElement( 'input' );
  popup.type = 'checkbox';
  popup.id = STORAGE_KEYS.individualEnabled;
  h.document.body.append( popup );
  const dispose = bindKdrOptions( h.document, h.storage );
  try {
    await h.input( 'individualEnabled', true );
    assert.equal( popup.checked, true );
    await new Promise( resolve => h.storage.sync.set( { [popup.id]: false }, resolve ) );
    await h.tick();
    assert.equal( h.document.querySelector( '[name="individualEnabled"]' ).checked, false );
    const before = h.runs();
    await h.tick();
    assert.equal( h.runs(), before );
  } finally { dispose(); h.close(); }
} );

test( 'zero em carregamento é desconhecido; zero publicado é reprovação real', async () => {
  const h = await harness( listing( room( 1, [ 0 ] ) ) );
  try {
    const slot = h.document.querySelector( '.LobbyPlayerVertical' );
    slot.setAttribute( 'aria-busy', 'true' );
    await h.input( 'individualEnabled', true );
    assert.equal( JSON.parse( h.document.getElementById( 'gcb-kdr-filters' ).dataset.counts ).pending, 1 );
    slot.removeAttribute( 'aria-busy' );
    await h.tick();
    assert.equal( JSON.parse( h.document.getElementById( 'gcb-kdr-filters' ).dataset.counts ).hidden, 1 );
    assert.equal( h.hidden( 1 ), true );
  } finally { h.close(); }
} );
