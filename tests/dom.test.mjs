import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { readLobby } from '../src/lib/kdr/dom.mjs';
import { room, player } from './helpers.mjs';

function read( html ) {
  const dom = new JSDOM( html );
  const result = readLobby( dom.window.document.querySelector( 'article' ) );
  dom.window.close();
  return result;
}

test( 'dados reais do tooltip: média original e jogadores distintos', () => {
  const result = read( room( 1, [ '1,10', '1.20', '1.05' ] ) );
  assert.equal( result.rosterComplete, true );
  assert.deepEqual( result.players.map( p => p.kdr ), [ 1.1, 1.2, 1.05 ] );
  assert.equal( result.average, null ); // The original display module calculates the mean.
} );

test( 'prioriza média publicada, sem recalcular metodologia da plataforma', () => {
  const result = read( room( 1, [ 1.5, 2 ] ).replace( '<h3', '<span gcbooster_kdr_medio="0.95"></span><h3' ) );
  assert.equal( result.average, 0.95 );
  assert.equal( result.nativeAverage, true );
} );

test( 'não calcula média de subconjunto nem reutiliza média derivada antiga', () => {
  const result = read( room( 1, [ 2, null ] ).replace( '<h3',
    '<span gcbooster_kdr_medio="2" data-gcb-derived-average></span><h3' ) );
  assert.equal( result.average, null );
} );

test( 'badge Booster antigo não aprova jogador substituído ou dado removido', () => {
  const result = read( `<article>${player( 42, null ).replace( '</a>',
    '<div id="gcbooster_kdr" title="KDR: 2.50"><span gcbooster_kdr_lobby="1" kdr="2.50">2.50</span></div></a>' )}</article>` );
  assert.deepEqual( result.players, [ { id: '42', kdr: null, reason: 'individual_kdr_unavailable' } ] );
} );

test( 'placeholders não são jogadores; sala vazia não tem média', () => {
  const result = read( '<article><a class="LobbyPlayerVertical"><div class="PlayerPlaceholder"></div></a></article>' );
  assert.deepEqual( result.players, [] );
  assert.equal( result.average, null );
  assert.equal( result.rosterComplete, false );
} );

test( 'layout legado, slots aninhados e perfil do raio X não duplicam roster', () => {
  const result = read( `<article><div class="sala-lineup-player"><div class="sala-lineup-imagem">${player( 1, 0 )}</div></div>
    <div class="infos_lobby">${player( 99, 0.5 )}</div></article>` );
  assert.deepEqual( result.players, [ { id: '1', kdr: 0 } ] );
} );

test( 'ID desconhecido ou duplicado impede aprovar roster', () => {
  assert.equal( read( `<article>${player( 1, 2 )}${player( 1, 2 )}</article>` ).rosterComplete, false );
  assert.equal( read( '<article><a class="LobbyPlayerVertical" title="KDR: 2.00">Nome</a></article>' ).rosterComplete, false );
} );

test( 'link de outro jogador fora do slot conhecido também entra na verificação', () => {
  const result = read( `<article>${player( 1, 2 )}<a href="/player/2" title="KDR: 0.50">Outro jogador</a></article>` );
  assert.deepEqual( result.players.map( p => p.kdr ), [ 2, 0.5 ] );
} );

test( 'suporta atributos explícitos de estatística sem confundir KDR com level/ADR', () => {
  const result = read( '<article><div class="LobbyPlayerVertical" data-player-id="42" title="Level: 20 ADR: 90">' +
    '<span data-stat="KDR" data-value="1,23"></span></div></article>' );
  assert.deepEqual( result.players, [ { id: '42', kdr: 1.23 } ] );
} );

test( 'roster delimitado evita contar o link do proprietário fora da lista de jogadores', () => {
  const html = room( 1, [ 1.2 ] ).replace( '<h3', '<a href="/jogador/1">Dono da sala</a><h3' );
  assert.deepEqual( read( html ).players, [ { id: '1', kdr: 1.2 } ] );
} );

test( 'identidades adicionais por atributo/avatar não são ignoradas em roster parcial', () => {
  const html = room( 1, [ 1.2 ] ).replace( '</div>',
    '<div data-player-id="99"><span data-stat="KDR">0.5</span></div>' +
    '<img src="https://static.gamersclub.com.br/players/avatar/12345/photo.jpg"></div>' );
  assert.deepEqual( read( html ).players, [ { id: '1', kdr: 1.2 }, { id: '99', kdr: 0.5 },
    { id: '12345', kdr: null, reason: 'individual_kdr_unavailable' } ] );
} );
