import test from 'node:test';
import assert from 'node:assert/strict';
import { harness, listing, room } from './helpers.mjs';

test( 'same counts: no live announcement or repeated statistic metadata writes', async () => {
  const h = await harness();
  try {
    await h.input( 'individualEnabled', true );
    const panel = h.document.getElementById( 'gcb-kdr-filters' );
    const counter = panel.querySelector( '.gcb-kdr-count' );
    assert.equal( panel.querySelector( '.gcb-kdr-hint' ), null );
    assert.equal( panel.querySelector( '#gcb-kdr-help' ), null );
    assert.equal( panel.textContent.includes( 'Formato decimal' ), false );
    let announcements = 0;
    let statisticWrites = 0;
    const live = new h.window.MutationObserver( records => { announcements += records.length; } );
    live.observe( counter, { childList: true, characterData: true, subtree: true } );
    const stats = new h.window.MutationObserver( records => { statisticWrites += records.length; } );
    stats.observe( h.document.querySelector( '.gcbooster-kdr-media' ), { attributes: true } );
    const before = h.runs();
    for ( let i = 0; i < 5; i++ ) {
      h.document.querySelector( '.LobbyPlayerVertical' ).setAttribute( 'title', `KDR: 1.20 Level: ${i}` );
      await h.tick();
    }
    assert.equal( announcements, 0 );
    assert.equal( statisticWrites, 0 );
    assert.equal( h.runs() - before, 5, 'one evaluation per external batch; no feedback loop' );
    await h.input( 'individualEnabled', false );
    assert.equal( counter.hidden, true );
    assert.equal( panel.querySelector( '.gcb-kdr-footer' ).hidden, true );
    live.disconnect();
    stats.disconnect();
  } finally { h.close(); }
} );

test( 'reprocessing never replaces rendered articles with skeletons', async () => {
  const h = await harness( listing( room( 1, [ 0.6 ] ) ) );
  try {
    const article = h.document.querySelector( 'article.LobbyRoom' );
    await h.input( 'individualEnabled', true );
    for ( let i = 0; i < 8; i++ ) {
      article.setAttribute( 'title', `external update ${i}` );
      await h.tick();
      assert.equal( h.document.querySelector( 'article.LobbyRoom' ), article );
      assert.equal( h.document.querySelector( 'article.CardSkeleton' ), null );
    }
    assert.equal( h.hidden( 1 ), true );
  } finally { h.close(); }
} );
