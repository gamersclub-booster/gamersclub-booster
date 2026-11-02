import { parseKdr } from './rules.mjs';

export const LIST_SELECTOR = '#lobbies-wrapper';
export const ROOM_SELECTOR = '[id^="roomCardWrapper-"]';
const SLOT_SELECTOR = '.LobbyPlayerVertical, .sala-lineup-player, .sala-lineup-player-plus, ' +
  '[data-player-id], [data-playerid], [id^="trigger-"], img[src*="/avatar/"], img[src*="/players/"]';
const LINK_SELECTOR = 'a[href*="/jogador/"], a[href*="/player/"]';
const EXCLUDED = '.infos_lobby, .gcbooster_lupa, .LobbyChallengeLineUpCard';

function playerId( slot ) {
  const nodes = [ slot, ...slot.querySelectorAll( 'a[href], [data-player-id], [data-playerid], [id^="trigger-"]' ) ];
  for ( const node of nodes ) {
    const match = ( node.getAttribute( 'href' ) || '' ).match( /\/(?:jogador|player)\/(\d+)(?:[/?#]|$)/i );
    const id = match?.[1] || node.getAttribute( 'data-player-id' ) || node.getAttribute( 'data-playerid' ) ||
      node.id?.match( /^trigger-(\d+)$/ )?.[1];
    if ( id && /^\d+$/.test( id ) && Number( id ) > 0 ) { return id; }
    const avatar = ( node.getAttribute( 'src' ) || '' ).match( /\/(?:players\/)?avatar\/(\d{3,})(?:\/|$)/i );
    if ( avatar?.[1] ) { return avatar[1]; }
  }
  return null;
}

function kdrFromTooltip( text ) {
  const match = text?.replace( /<[^>]*>/g, ' ' ).match( /\bKDR\s*:?\s*(\d+(?:[.,]\d+)?)(?=\s|$|[|;])/i );
  return parseKdr( match?.[1] );
}

function isLoading( node ) {
  return !!node.closest( '[aria-busy="true"], [data-loading="true"], .is-loading, .skeleton' );
}

function readPlayerStat( slot ) {
  if ( isLoading( slot ) ) {
    return { kdr: null, source: null, reason: 'loading' };
  }
  // Read the live source used by mostrarKdr, never a previously injected badge:
  // React can reuse a slot for another player without replacing Booster's badge.
  const nodes = [ slot, ...slot.querySelectorAll( '[title], [data-tip-text], [data-kdr], [data-stat="KDR"]' ) ];
  for ( const node of nodes ) {
    if ( isLoading( node ) ) { continue; }
    if ( node.closest( '#gcbooster_kdr, .gcboost-kdr-color, .PlayerIdentityBadges__KDR, .infos_lobby' ) ) { continue; }
    const title = node.getAttribute( 'title' );
    const tip = node.getAttribute( 'data-tip-text' );
    const titleKdr = kdrFromTooltip( title );
    const tooltip = titleKdr ?? kdrFromTooltip( tip );
    if ( tooltip !== null ) {
      return { kdr: tooltip, source: titleKdr !== null ? title : tip };
    }
    const value = parseKdr( node.getAttribute( 'data-kdr' ) );
    if ( value !== null ) { return { kdr: value, source: `data-kdr:${node.getAttribute( 'data-kdr' )}` }; }
    if ( node.getAttribute( 'data-stat' ) === 'KDR' ) {
      const stat = parseKdr( node.getAttribute( 'data-value' ) ?? node.textContent );
      if ( stat !== null ) { return { kdr: stat, source: `stat:${node.getAttribute( 'data-value' ) ?? node.textContent}` }; }
    }
  }
  const loadingStat = slot.querySelector( '[data-stat="KDR"][aria-busy="true"], [data-stat="KDR"][data-loading="true"]' );
  return { kdr: null, source: null, reason: loadingStat ? 'loading' : 'individual_kdr_unavailable' };
}

export function readLobby( room, identities = new WeakMap() ) {
  const roster = room.querySelector( '.LobbyRoom__lineup, .sala-lineup-players' ) || room;
  let slots = Array.from( roster.querySelectorAll( SLOT_SELECTOR ) );
  slots.push( ...roster.querySelectorAll( LINK_SELECTOR ) );
  slots = [ ...new Set( slots ) ];
  slots = slots.filter( slot => !slot.closest( EXCLUDED ) && !slots.some( other => other !== slot && other.contains( slot ) ) );
  const players = [];
  for ( const slot of slots ) {
    if ( slot.matches( '.PlayerPlaceholder, .sala-lineup-placeholder' ) || slot.querySelector( '.PlayerPlaceholder' ) ) { continue; }
    const id = playerId( slot );
    const stat = readPlayerStat( slot );
    const previous = identities.get( slot );
    const sameSource = previous && previous.source === stat.source;
    const blocked = !!( sameSource && ( previous.id !== id || previous.blocked ) );
    identities.set( slot, { id, source: stat.source, blocked } );
    const player = { id, kdr: blocked ? null : stat.kdr };
    if ( blocked ) { player.reason = 'identity_changed_stat_unchanged'; } else if ( stat.reason ) { player.reason = stat.reason; }
    players.push( player );
  }
  // Duplicate or unidentified identities are conservatively pending; never silently
  // drop an occupied slot or infer its KDR from a different player's data.
  const ids = players.map( player => player.id );
  const rosterComplete = players.length > 0 && ids.every( Boolean ) && new Set( ids ).size === ids.length;
  const meanNodes = room.querySelectorAll( '[gcbooster_kdr_medio], [data-average-kdr], [data-stat="average-kdr"]' );
  let average = null;
  for ( const node of [ room, ...meanNodes ] ) {
    if ( isLoading( node ) || node.hasAttribute( 'data-gcb-derived-average' ) ) { continue; }
    average = parseKdr( node.getAttribute( 'gcbooster_kdr_medio' ) ?? node.getAttribute( 'data-average-kdr' ) ??
      ( node.getAttribute( 'data-stat' ) === 'average-kdr' ? node.getAttribute( 'data-value' ) ?? node.textContent : null ) );
    if ( average !== null ) { break; }
  }
  const nativeAverage = average !== null;
  const structureKnown = !!room.querySelector( '.LobbyRoom__lineup, .sala-lineup-players' ) || slots.length > 0;
  return { average, players, rosterComplete, nativeAverage, structureKnown };
}
