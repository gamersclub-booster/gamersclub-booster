import test from 'node:test';
import assert from 'node:assert/strict';
import { harness, listing, room, player } from './helpers.mjs';
import { STORAGE_KEYS } from '../src/lib/kdr/rules.mjs';

test( 'UI padrão, filtros independentes, contadores e restauração', async () => {
  const h = await harness( listing( room( 1, [ 2.5, 1.4, 0.6 ] ) + room( 2, [ 1.1, 1.2, 1.05 ] ) + room( 3, [ null ] ) ) );
  try {
    assert.equal( h.hidden( 3 ), false );
    assert.equal( h.document.querySelector( '[name="averageMin"]' ).value, '1.00' );
    await h.input( 'averageEnabled', true );
    assert.equal( h.hidden( 1 ), false );
    assert.equal( h.hidden( 3 ), true );
    await h.input( 'individualEnabled', true );
    assert.equal( h.hidden( 1 ), true );
    assert.equal( h.hidden( 2 ), false );
    assert.match( h.document.querySelector( '.gcb-kdr-count' ).textContent, /1 sala exibida · 1 ocultada/ );
    await h.input( 'averageEnabled', false );
    assert.equal( h.hidden( 1 ), true );
    await h.input( 'individualEnabled', false );
    assert.equal( h.hidden( 1 ), false );
    assert.equal( h.hidden( 3 ), false );
  } finally { h.close(); }
} );

test( 'entrada/saída, troca de identidade no mesmo nó, tooltip/texto/atributo atualizados', async () => {
  const h = await harness();
  try {
    await h.input( 'individualEnabled', true );
    const lineup = h.document.querySelector( '.LobbyRoom__lineup' );
    lineup.insertAdjacentHTML( 'beforeend', player( 3, 0.6 ) );
    await h.tick();
    assert.equal( h.hidden( 1 ), true );
    lineup.lastElementChild.remove();
    await h.tick();
    assert.equal( h.hidden( 1 ), false );
    const slot = lineup.firstElementChild;
    slot.setAttribute( 'href', '/jogador/88' );
    await h.tick();
    assert.equal( h.hidden( 1 ), true, 'KDR antigo no slot reutilizado não pode aprovar a identidade nova' );
    await h.tick();
    assert.equal( h.hidden( 1 ), true, 'Reaplicação sem estatística nova continua pendente' );
    slot.removeAttribute( 'title' );
    slot.innerHTML = '<span id="gcbooster_kdr" title="KDR: 2.50">2.50</span>';
    await h.tick();
    assert.equal( h.hidden( 1 ), true );
    assert.equal( JSON.parse( h.document.getElementById( 'gcb-kdr-filters' ).dataset.counts ).pending, 1 );
    slot.setAttribute( 'title', 'KDR: 1.50' );
    await h.tick();
    assert.equal( h.hidden( 1 ), false );
    slot.removeAttribute( 'title' );
    slot.innerHTML = '<span data-stat="KDR">0.5</span>';
    await h.tick();
    assert.equal( h.hidden( 1 ), true );
    slot.firstChild.firstChild.data = '1.8';
    await h.tick();
    assert.equal( h.hidden( 1 ), false );
    slot.firstChild.setAttribute( 'data-value', '0' );
    await h.tick();
    assert.equal( h.hidden( 1 ), true );
  } finally { h.close(); }
} );

test( 'SPA: inicialização fora do lobby, recriação de lista, saída e retorno sem duplicação', async () => {
  const h = await harness( '<main>Perfil</main>', { [STORAGE_KEYS.individualEnabled]: true } );
  try {
    assert.equal( h.document.querySelector( '#gcb-kdr-filters' ), null );
    h.window.history.pushState( {}, '', '/lobby' );
    h.document.body.innerHTML = listing( room( 1, [ 0.5 ] ) );
    await h.tick();
    assert.equal( h.hidden( 1 ), true );
    h.document.getElementById( 'lobbies-wrapper' ).outerHTML = listing( room( 2, [ 1.5 ] ) );
    await h.tick();
    assert.equal( h.hidden( 2 ), false );
    assert.equal( h.document.querySelectorAll( '#gcb-kdr-filters' ).length, 1 );
    h.document.body.innerHTML = '<main>Perfil</main>';
    await h.tick();
    assert.equal( h.document.querySelector( '#gcb-kdr-filters' ), null );
    h.document.body.innerHTML = listing( room( 3, [ 0.5 ] ) );
    await h.tick();
    assert.equal( h.hidden( 3 ), true );
  } finally { h.close(); }
} );

test( 'persistência entre sessões, vírgula, precisão, inválidos e sincronização externa', async () => {
  const h = await harness();
  let stored;
  try {
    await h.input( 'averageMin', '1,21' );
    await h.input( 'individualMin', '1.05' );
    await h.input( 'individualEnabled', true );
    assert.equal( h.data[STORAGE_KEYS.averageMin], 1.21 );
    const input = await h.input( 'averageMin', 'abc' );
    assert.equal( input.getAttribute( 'aria-invalid' ), 'true' );
    assert.equal( h.data[STORAGE_KEYS.averageMin], 1.21 );
    await new Promise( resolve => h.storage.sync.set( { [STORAGE_KEYS.individualMin]: 2 }, resolve ) );
    await h.tick();
    assert.equal( h.hidden( 1 ), true );
    stored = { ...h.data };
  } finally { h.close(); }
  const next = await harness( undefined, stored );
  try {
    assert.equal( next.document.querySelector( '[name="averageMin"]' ).value, '1.21' );
    assert.equal( next.document.querySelector( '[name="individualEnabled"]' ).checked, true );
    assert.equal( next.hidden( 1 ), true );
  } finally { next.close(); }
} );

test( 'reset, mensagem vazia, atualizar, classe própria preserva estilo e clique de entrar', async () => {
  const h = await harness( listing( room( 1, [ 0.99 ] ) ) );
  try {
    const card = h.document.getElementById( 'roomCardWrapper-1' );
    card.style.display = 'flex';
    let joined = 0;
    card.querySelector( '.join' ).addEventListener( 'click', () => joined++ );
    await h.input( 'averageEnabled', true );
    assert.equal( h.hidden( 1 ), true );
    assert.equal( h.document.querySelector( '.gcb-kdr-empty' ).hidden, false );
    assert.equal( h.document.querySelector( '[data-action="refresh"]' ), null );
    h.document.querySelector( '[data-action="reset"]' ).click();
    await h.tick();
    assert.equal( h.hidden( 1 ), false );
    assert.equal( card.style.display, 'flex' );
    assert.equal( h.document.querySelector( '.gcb-kdr-empty' ).hidden, true );
    card.querySelector( '.join' ).click();
    assert.equal( joined, 1 );
    assert.equal( h.data[STORAGE_KEYS.averageEnabled], false );
    assert.equal( h.data[STORAGE_KEYS.individualEnabled], false );
  } finally { h.close(); }
} );

test( 'sem loop, agrupa mutações e destrói observadores/listeners e visibilidade', async () => {
  const h = await harness();
  try {
    await h.input( 'individualEnabled', true );
    const before = h.runs();
    const slot = h.document.querySelector( '.LobbyPlayerVertical' );
    for ( let i = 0; i < 100; i++ ) { slot.setAttribute( 'title', `KDR: 0.${i % 10}` ); }
    await h.tick();
    assert.equal( h.runs() - before, 1 );
    assert.equal( h.hidden( 1 ), true );
    await h.tick();
    assert.equal( h.runs() - before, 1 );
    h.controller.destroy();
    assert.equal( h.hidden( 1 ), false );
    assert.equal( h.listeners.size, 0 );
    slot.setAttribute( 'title', 'KDR: 0.01' );
    await h.tick();
    assert.equal( h.runs() - before, 1 );
  } finally { h.close(); }
} );

test( 'média nativa atualizada dinamicamente prevalece sobre a derivada', async () => {
  const h = await harness();
  try {
    await h.input( 'averageEnabled', true );
    const card = h.document.getElementById( 'roomCardWrapper-1' );
    card.setAttribute( 'data-average-kdr', '0.9' );
    await h.tick();
    assert.equal( h.hidden( 1 ), true );
    assert.equal( card.querySelector( '[data-gcb-derived-average]' ), null );
    card.setAttribute( 'data-average-kdr', '1.01' );
    await h.tick();
    assert.equal( h.hidden( 1 ), false );
  } finally { h.close(); }
} );
