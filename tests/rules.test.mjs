import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, STORAGE_KEYS, parseKdr, preferencesFromStorage, evaluateLobby } from '../src/lib/kdr/rules.mjs';

const players = values => values.map( ( kdr, index ) => ( { id: String( index + 1 ), kdr } ) );
const cases = [
  [ 'média abaixo', 0.75, [ 2 ], { averageEnabled: true }, 'hidden' ],
  [ 'média 0.93', 0.93, [ 2 ], { averageEnabled: true }, 'hidden' ],
  [ 'média igual', 1, [ 2 ], { averageEnabled: true }, 'visible' ],
  [ 'média 1.01', 1.01, [ 2 ], { averageEnabled: true }, 'visible' ],
  [ 'média 1.21', 1.21, [ 2 ], { averageEnabled: true }, 'visible' ],
  [ 'individual abaixo', 2, [ 2.5, 1.4, 0.6 ], { individualEnabled: true }, 'hidden' ],
  [ 'individual igual', 2, [ 1.1, 1 ], { individualEnabled: true }, 'visible' ],
  [ 'todos acima', 1.1, [ 1.1, 1.2, 1.05 ], { individualEnabled: true }, 'visible' ],
  [ 'um jogador igual', 1, [ 1 ], { individualEnabled: true }, 'visible' ],
  [ 'um jogador acima', 1.01, [ 1.01 ], { individualEnabled: true }, 'visible' ],
  [ 'só média ignora jogador baixo', 2, [ 0.6 ], { averageEnabled: true }, 'visible' ],
  [ 'só individual ignora média baixa', 0.5, [ 1.2 ], { individualEnabled: true }, 'visible' ],
  [ 'ambos exigem média', 0.9, [ 1.2 ], { averageEnabled: true, individualEnabled: true }, 'hidden' ],
  [ 'ambos exigem indivíduos', 2, [ 0.6 ], { averageEnabled: true, individualEnabled: true }, 'hidden' ],
  [ 'ambos aprovados', 1.3, [ 1.1, 1.5 ], { averageEnabled: true, averageMin: 1.2, individualEnabled: true }, 'visible' ],
  [ 'limites diferentes estritos', 1.2, [ 1.1 ], { averageEnabled: true, averageMin: 1.2, individualEnabled: true }, 'visible' ],
  [ 'média ausente', null, [ 2 ], { averageEnabled: true }, 'pending' ],
  [ 'individual ausente', 2, [ 2, null ], { individualEnabled: true }, 'pending' ],
  [ 'zero real', 2, [ 0 ], { individualEnabled: true, individualMin: 0 }, 'visible' ],
  [ 'média zero real', 0, [ 2 ], { averageEnabled: true, averageMin: 0 }, 'visible' ],
  [ 'lobby vazio', null, [], { individualEnabled: true }, 'pending' ],
  [ 'ambos desligados restauram inclusive pendentes', null, [ null ], {}, 'visible' ],
  [ 'falha conhecida e dado ausente', 2, [ 0.5, null ], { individualEnabled: true }, 'hidden' ]
];

for ( const [ name, average, values, options, expected ] of cases ) {
  test( name, () => assert.equal( evaluateLobby( { average, players: players( values ) }, { ...DEFAULTS, ...options } ), expected ) );
}

test( 'validação decimal: vírgula, ponto, zero e números inválidos', () => {
  for ( const value of [ '1.00', '1,00', ' 1.00 ', 1 ] ) { assert.equal( parseKdr( value ), 1 ); }
  assert.equal( parseKdr( '0' ), 0 );
  assert.equal( parseKdr( '3,25' ), 3.25 );
  for ( const value of [ '', ' ', null, undefined, false, NaN, Infinity, -1, '-1', '1abc', '1.2.3', '1,2,3', '1e2' ] ) {
    assert.equal( parseKdr( value ), null, String( value ) );
  }
} );

test( 'padrões desativados e armazenamento validado, sem perda de precisão', () => {
  assert.deepEqual( preferencesFromStorage(), DEFAULTS );
  assert.deepEqual( preferencesFromStorage( {
    [STORAGE_KEYS.averageEnabled]: true,
    [STORAGE_KEYS.averageMin]: '1,21',
    [STORAGE_KEYS.individualEnabled]: 'false',
    [STORAGE_KEYS.individualMin]: -2
  } ), { averageEnabled: true, averageMin: 1.21, individualEnabled: false, individualMin: 1 } );
} );

test( 'identidade/roster incompleto permanece pendente', () => {
  assert.equal( evaluateLobby( { average: 2, players: players( [ 2 ] ), rosterComplete: false },
    { ...DEFAULTS, individualEnabled: true } ), 'pending' );
} );
