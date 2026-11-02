export const DEFAULTS = Object.freeze( {
  averageEnabled: false,
  averageMin: 1,
  individualEnabled: false,
  individualMin: 1
} );

export const STORAGE_KEYS = Object.freeze( {
  averageEnabled: 'filtrarKdrMedioLobby',
  averageMin: 'filtrarKdrMedioLobbyMin',
  individualEnabled: 'filtrarKdrIndividualLobby',
  individualMin: 'filtrarKdrIndividualLobbyMin'
} );

// Full-string parsing deliberately distinguishes unavailable data from a real zero.
export function parseKdr( value ) {
  if ( typeof value === 'number' ) {
    return Number.isFinite( value ) && value >= 0 ? value : null;
  }
  if ( typeof value !== 'string' || !/^\d+(?:[.,]\d+)?$/.test( value.trim() ) ) { return null; }
  const number = Number( value.trim().replace( ',', '.' ) );
  return Number.isFinite( number ) ? number : null;
}

export function preferencesFromStorage( stored = {} ) {
  const preferences = { ...DEFAULTS };
  for ( const [ field, key ] of Object.entries( STORAGE_KEYS ) ) {
    if ( field.endsWith( 'Enabled' ) ) {
      preferences[field] = stored[key] === true;
    } else {
      preferences[field] = parseThreshold( stored[key] ) ?? DEFAULTS[field];
    }
  }
  return preferences;
}

export function evaluateLobby( { average, players, rosterComplete = true }, preferences ) {
  const { averageEnabled, averageMin, individualEnabled, individualMin } = preferences;
  if ( !averageEnabled && !individualEnabled ) { return 'visible'; }
  const mean = comparisonKdr( average );
  const values = players.map( player => comparisonKdr( player.kdr ) );
  // A known failure rejects immediately, even if another required statistic is missing.
  if ( averageEnabled && mean !== null && mean < comparisonKdr( averageMin ) ) { return 'hidden'; }
  if ( individualEnabled && values.some( value => value !== null && value < comparisonKdr( individualMin ) ) ) { return 'hidden'; }
  if ( averageEnabled && mean === null ) { return 'pending'; }
  if ( individualEnabled && ( !rosterComplete || !players.length || values.includes( null ) ) ) { return 'pending'; }
  return 'visible';
}

export function parseThreshold( value ) {
  const number = parseKdr( value );
  return number !== null && number <= 100 ? number : null;
}

export function stepThreshold( value, direction ) {
  return Math.max( 0, Math.min( 10000, Math.round( value * 100 ) + ( direction * 5 ) ) ) / 100;
}

// Match the two-decimal presentation, including the derived lobby mean.
export function comparisonKdr( value ) {
  const parsed = parseKdr( value );
  return parsed === null ? null : Number( parsed.toFixed( 2 ) );
}

export function pendingReasons( lobby, preferences ) {
  if ( evaluateLobby( lobby, preferences ) !== 'pending' ) { return []; }
  const reasons = new Set();
  if ( preferences.averageEnabled && lobby.average === null ) { reasons.add( 'average_unavailable' ); }
  if ( preferences.individualEnabled || ( preferences.averageEnabled && lobby.average === null ) ) {
    if ( !lobby.players.length ) { reasons.add( lobby.structureKnown ? 'empty_roster' : 'structure_unrecognized' ); }
    if ( lobby.players.some( player => !player.id ) ) { reasons.add( 'identity_unrecognized' ); }
    const ids = lobby.players.map( player => player.id ).filter( Boolean );
    if ( new Set( ids ).size !== ids.length ) { reasons.add( 'duplicate_identity' ); }
    for ( const player of lobby.players ) {
      if ( player.kdr === null ) { reasons.add( player.reason || 'individual_kdr_unavailable' ); }
    }
  }
  return [ ...reasons ];
}
