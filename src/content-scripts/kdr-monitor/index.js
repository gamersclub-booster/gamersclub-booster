/**
 * ============================================================
 * @file        index.js (kdr-monitor)
 * @author      Caio Felipe
 * @version     1.0.1
 *
 * @description
 *   Content script executado no MAIN world (document_start).
 *   Consome a biblioteca GCSocketDecoder para interceptar e
 *   decodificar mensagens WebSocket da GamerClub, mescla os
 *   dados com respostas HTTP e exibe o KDR dos jogadores
 *   diretamente sobre os avatares na interface do lobby.
 * ============================================================
 */

import { GCSocketDecoder } from '../../lib/gc-socket-decoder';

// ==========================================
// CONFIGURAÇÃO & CONTROLE DE DEBUG
// ==========================================

const DEBUG = false;
const isDebug = () => Boolean( DEBUG || ( typeof window !== 'undefined' && window.__GC_DEBUG__ ) );

const debugLog = ( ...args ) => {
  if ( isDebug() ) {
    console.log( ...args );
  }
};

const debugWarn = ( ...args ) => {
  if ( isDebug() ) {
    console.warn( ...args );
  }
};

const debugGroup = ( ...args ) => {
  if ( isDebug() ) {
    console.group( ...args );
  }
};

const debugGroupEnd = () => {
  if ( isDebug() ) {
    console.groupEnd();
  }
};

( () => {
  // ==========================================
  // CONFIGURAÇÃO
  // ==========================================

  const API_URL = '/lobbyBeta/listRooms';
  const REGION = '27';

  const STYLE_ID = 'gc-kdr-monitor-style';
  const PLAYER_SELECTOR = '.LobbyRoom__lineup a.LobbyPlayerVertical, .LobbyChallengeLineUpCard a.LobbyPlayerVertical, a.LobbyPlayerVertical';
  const TEAM_PLAYER_SELECTOR = '#integrantesLobbyShort .player, .MyRoomPlayers .player, #integrantesLobby .player, [id*="integrantesLobby"] .player';

  // ==========================================
  // ESTADO E CONTROLE DE CICLO DE VIDA
  // ==========================================

  let monitorActive = false;
  let interceptorsInstalled = false;
  let domObserver = null;
  let rafPending = false;
  let pendingDOMListener = null;

  // Referências originais da plataforma
  const OriginalWebSocket = window.WebSocket;
  const originalAddEventListener = OriginalWebSocket.prototype.addEventListener;
  const originalFetch = window.fetch;
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  // Referências instaladas para restauração segura
  let gcFetch = null;
  let gcXHROpen = null;
  let gcXHRSend = null;
  let MonitoredWebSocket = null;

  // Sockets já anexados
  const monitoredSockets = new WeakSet();

  // ==========================================
  // NORMALIZAÇÃO DE DADOS
  // ==========================================

  function normalizeName( name ) {
    return String( name || '' )
      .normalize( 'NFD' )
      .replace( /[\u0300-\u036f]/g, '' )
      .trim()
      .toLowerCase()
      .replace( /\s+/g, ' ' );
  }

  function getPlayerName( element ) {
    const title = element.getAttribute( 'title' );
    if ( !title ) { return null; }
    return title.split( '\n' )[0].split( '|' )[0].trim();
  }

  // ==========================================
  // GERENCIAMENTO CENTRALIZADO DE DADOS
  // ==========================================

  const roomStore = new Map();

  /**
   * Localiza um jogador existente na lista utilizando a estratégia hierárquica:
   * 1. steam_id (mais confiável)
   * 2. id (identificador interno da GamersClub)
   * 3. name normalizado (fallback)
   */
  function findMatchingPlayerIndex( playerList, candidate ) {
    if ( !candidate || !Array.isArray( playerList ) ) { return -1; }

    // 1. Steam ID
    if ( candidate.steam_id ) {
      const candSteam = String( candidate.steam_id ).trim();
      if ( candSteam ) {
        const idx = playerList.findIndex( p => p.steam_id && String( p.steam_id ).trim() === candSteam );
        if ( idx !== -1 ) { return idx; }
      }
    }

    // 2. ID interno
    if ( candidate.id ) {
      const candId = String( candidate.id ).trim();
      if ( candId ) {
        const idx = playerList.findIndex( p => p.id && String( p.id ).trim() === candId );
        if ( idx !== -1 ) { return idx; }
      }
    }

    // 3. Nome normalizado
    if ( candidate.name ) {
      const candNorm = normalizeName( candidate.name );
      if ( candNorm ) {
        const idx = playerList.findIndex( p => p.name && normalizeName( p.name ) === candNorm );
        if ( idx !== -1 ) { return idx; }
      }
    }

    return -1;
  }

  /**
   * Realiza merge de atributos de jogador, impedindo que null, undefined ou
   * strings vazias sobrescrevam dados válidos previamente conhecidos.
   */
  function mergePlayer( oldPlayer, newPlayer ) {
    const merged = { ...oldPlayer };

    for ( const [ key, value ] of Object.entries( newPlayer ) ) {
      if ( value !== null && value !== undefined && value !== '' ) {
        merged[key] = value;
      }
    }

    return merged;
  }

  /**
   * Mescla as informações de uma sala, reconciliando jogadores e
   * gerenciando entradas e saídas (snapshots completos vs parciais).
   */
  function mergeRoom( roomId, incomingPlayers, metadata = {} ) {
    const strRoomId = String( roomId );
    const current = roomStore.get( strRoomId ) || {
      room_id: strRoomId,
      players: []
    };

    const isSnapshot = metadata.isSnapshot !== false;
    const currentPlayers = [ ...current.players ];
    const updatedPlayers = [];
    const matchedOldIndices = new Set();

    incomingPlayers.forEach( incoming => {
      // Ignora jogadores sem identificador utilizável
      const hasId = Boolean( incoming.id && String( incoming.id ).trim() );
      const hasSteam = Boolean( incoming.steam_id && String( incoming.steam_id ).trim() );
      const hasName = Boolean( incoming.name && String( incoming.name ).trim() );

      if ( !hasId && !hasSteam && !hasName ) { return; }

      const matchIdx = findMatchingPlayerIndex( currentPlayers, incoming );
      if ( matchIdx !== -1 ) {
        matchedOldIndices.add( matchIdx );
        const existing = currentPlayers[matchIdx];
        updatedPlayers.push( mergePlayer( existing, incoming ) );
      } else {
        updatedPlayers.push( { ...incoming } );
      }
    } );

    // Se for atualização parcial, mantém jogadores antigos não presentes no pacote
    if ( !isSnapshot ) {
      for ( let i = 0; i < currentPlayers.length; i++ ) {
        if ( !matchedOldIndices.has( i ) ) {
          updatedPlayers.push( currentPlayers[i] );
        }
      }
    }

    roomStore.set( strRoomId, {
      ...current,
      ...metadata,
      room_id: strRoomId,
      players: updatedPlayers
    } );

    publishRoomData();
  }

  function publishRoomData() {
    if ( !monitorActive ) { return; }

    const rooms = Array.from( roomStore.values() );

    window.gcRoomData = {
      source: 'merged',
      rooms,
      players: rooms.flatMap( room =>
        room.players.map( player => ( {
          ...player,
          room_id: room.room_id
        } ) )
      )
    };

    scheduleKDRUpdate();
  }

  // ==========================================
  // ESTILIZAÇÃO E INTERFACE
  // ==========================================

  function injectStyles() {
    if ( document.getElementById( STYLE_ID ) ) { return; }

    const style = document.createElement( 'style' );
    style.id = STYLE_ID;

    style.textContent = `
            .gc-kdr-wrapper {
                position: relative !important;
                overflow: visible !important;
            }

            .gc-kdr-badge {
                position: absolute !important;
                top: -19px !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
                z-index: 9999 !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                min-width: 42px !important;
                height: 17px !important;
                padding: 0 5px !important;
                box-sizing: border-box !important;
                background: #111827 !important;
                border: 1px solid #16a34a !important;
                border-radius: 5px !important;
                color: #4ade80 !important;
                font-family: Arial, sans-serif !important;
                font-size: 10px !important;
                font-weight: 800 !important;
                line-height: 1 !important;
                white-space: nowrap !important;
                pointer-events: none !important;
                box-shadow: 0 2px 5px rgba(0,0,0,.45) !important;
            }

            .gc-kdr-badge::before {
                content: "" !important;
                margin-right: 3px !important;
                color: #9ca3af !important;
                font-size: 8px !important;
            }

            .gc-kdr-room-badge {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-family: Arial, sans-serif !important;
                font-size: 11px !important;
                font-weight: 700 !important;
                padding: 2px 6px !important;
                border-radius: 4px !important;
                background: rgba(245, 158, 11, 0.15) !important;
                border: 1px solid rgba(245, 158, 11, 0.5) !important;
                color: #f59e0b !important;
                margin-left: auto !important;
                line-height: 1.1 !important;
                white-space: nowrap !important;
                vertical-align: middle !important;
                box-shadow: 0 1px 3px rgba(0,0,0,.3) !important;
                pointer-events: auto !important;
            }

            .gc-kdr-team-badge {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                min-width: 42px !important;
                height: 17px !important;
                padding: 0 5px !important;
                box-sizing: border-box !important;
                background: #111827 !important;
                border: 1px solid #16a34a !important;
                border-radius: 5px !important;
                color: #4ade80 !important;
                font-family: Arial, sans-serif !important;
                font-size: 10px !important;
                font-weight: 800 !important;
                line-height: 1 !important;
                white-space: nowrap !important;
                pointer-events: none !important;
                box-shadow: 0 2px 5px rgba(0,0,0,.45) !important;
                margin-left: auto !important;
            }

            .gc-kdr-team-badge::before {
                content: "" !important;
                margin-right: 3px !important;
                color: #9ca3af !important;
                font-size: 8px !important;
                text-align: center !important;
            }

            .styles_badges__uB3qD,
            [class*="styles_badges__"] {
                display: flex !important;
                align-items: center !important;
                width: 100% !important;
            }
        `;

    document.head.appendChild( style );
  }

  function removeStyles() {
    document.getElementById( STYLE_ID )?.remove();
  }

  function clearDOMBadges() {
    document.querySelectorAll(
      '.gc-kdr-badge, .gc-kdr-room-badge, .gc-kdr-team-badge, .gcbooster-kdr-media, .gcbooster-kdr'
    ).forEach( el => el.remove() );
    document.querySelectorAll( '.gc-kdr-wrapper' ).forEach( el => el.classList.remove( 'gc-kdr-wrapper' ) );
  }

  /**
   * Atualização otimizada dos badges KDR no DOM:
   * - Utiliza Map com busca O(1) por nome normalizado.
   * - Modifica o DOM apenas quando o badge for novo ou o valor tiver mudado.
   */
  function updatePlayerKDR() {
    if ( !monitorActive || !window.gcRoomData ) { return; }

    const players = window.gcRoomData.players || [];
    if ( !players.length ) { return; }

    const playerMap = new Map();
    for ( const player of players ) {
      if ( player.name ) {
        const norm = normalizeName( player.name );
        if ( norm && !playerMap.has( norm ) ) {
          playerMap.set( norm, player );
        }
      }
    }

    const elements = document.querySelectorAll( PLAYER_SELECTOR );
    for ( let i = 0; i < elements.length; i++ ) {
      const element = elements[i];
      const htmlName = getPlayerName( element );
      if ( !htmlName ) { continue; }

      const normalizedHTMLName = normalizeName( htmlName );
      const playerData = playerMap.get( normalizedHTMLName );

      if (
        !playerData ||
        typeof playerData.kdr !== 'number' ||
        !Number.isFinite( playerData.kdr )
      ) {
        continue;
      }

      const avatarWrapper = element.querySelector( '[id^="player-trigger-wrapper-"]' );
      if ( !avatarWrapper ) { continue; }

      const formattedKDR = playerData.kdr.toFixed( 2 );
      let badge = avatarWrapper.querySelector( '.gc-kdr-badge' );

      if ( !badge ) {
        avatarWrapper.classList.add( 'gc-kdr-wrapper' );
        badge = document.createElement( 'span' );
        badge.className = 'gc-kdr-badge';
        badge.dataset.kdr = formattedKDR;
        badge.textContent = formattedKDR;
        avatarWrapper.appendChild( badge );
      } else if ( badge.dataset.kdr !== formattedKDR ) {
        badge.dataset.kdr = formattedKDR;
        badge.textContent = formattedKDR;
      }

      if ( element.dataset.gcKdr !== formattedKDR ) {
        element.dataset.gcKdr = formattedKDR;
      }
      const pid = playerData.id || '';
      if ( element.dataset.gcPlayerId !== pid ) {
        element.dataset.gcPlayerId = pid;
      }
    }
  }

  function buildPlayerIndex( players ) {
    const byId = new Map();
    const byName = new Map();

    for ( const player of players ) {
      if ( player.id ) {
        const idStr = String( player.id ).trim();
        if ( idStr && !byId.has( idStr ) ) {
          byId.set( idStr, player );
        }
      }
      if ( player.name ) {
        const norm = normalizeName( player.name );
        if ( norm && !byName.has( norm ) ) {
          byName.set( norm, player );
        }
      }
    }

    return { byId, byName };
  }

  function findPlayerData( id, name, playerIndex ) {
    if ( id ) {
      const idStr = String( id ).trim();
      const match = playerIndex.byId.get( idStr );
      if ( match ) { return match; }
    }

    if ( name ) {
      const norm = normalizeName( name );
      const match = playerIndex.byName.get( norm );
      if ( match ) { return match; }
    }

    return null;
  }

  function extractTeamPlayerInfo( element ) {
    let id = null;
    let name = null;

    // 1. Link do jogador: <a href="/player/2841710" target="_blank" rel="noreferrer"> Soren;)</a>
    const link = element.querySelector( 'a[href*="/player/"], [class*="styles_nickname"] a, [class*="nickname"] a' );
    if ( link ) {
      const href = link.getAttribute( 'href' ) || '';
      const hrefMatch = href.match( /\/player\/(\d+)/i );
      if ( hrefMatch ) {
        id = hrefMatch[1];
      }
      const text = link.textContent?.trim();
      if ( text ) {
        name = text;
      }
    }

    // 2. Trigger wrappers: id="player-trigger-wrapper-2841710" ou id="player-trigger-2841710"
    if ( !id ) {
      const trigger = element.querySelector( '[id^="player-trigger-wrapper-"], [id^="player-trigger-"]' );
      if ( trigger ) {
        const match = trigger.id.match( /player-trigger(?:-wrapper)?-(\d+)/ );
        if ( match ) {
          id = match[1];
        }
      }
    }

    // 3. Imagem do avatar: src=".../avatar/2841710/..." e alt=" Soren;)"
    const avatarImg = element.querySelector( '.AvatarWrapper__image, [class*="AvatarWrapper__image"], img[src*="/players/avatar/"]' );
    if ( avatarImg ) {
      if ( !id ) {
        const src = avatarImg.getAttribute( 'src' ) || '';
        const srcMatch = src.match( /\/avatar\/(\d+)\// );
        if ( srcMatch ) {
          id = srcMatch[1];
        }
      }
      if ( !name ) {
        const alt = avatarImg.getAttribute( 'alt' )?.trim();
        if ( alt ) {
          name = alt;
        }
      }
    }

    return { id, name };
  }

  /**
   * Atualização otimizada dos badges KDR nos jogadores do time:
   * - Localiza jogadores na listagem (#integrantesLobbyShort / .MyRoomPlayers).
   * - Insere o badge à direita do container .styles_badges__uB3qD.
   */
  function updateTeamPlayerKDR() {
    if ( !monitorActive || !window.gcRoomData ) { return; }

    const players = window.gcRoomData.players || [];
    if ( !players.length ) { return; }

    const playerIndex = buildPlayerIndex( players );

    let elements = document.querySelectorAll( TEAM_PLAYER_SELECTOR );
    if ( !elements.length ) {
      elements = document.querySelectorAll( '.player' );
    }

    for ( let i = 0; i < elements.length; i++ ) {
      const element = elements[i];
      const badgesContainer = element.querySelector(
        '.styles_badges__uB3qD, [class*="styles_badges__"], [class*="badges__"]'
      );
      if ( !badgesContainer ) { continue; }

      const { id, name } = extractTeamPlayerInfo( element );
      if ( !id && !name ) { continue; }

      const playerData = findPlayerData( id, name, playerIndex );
      if (
        !playerData ||
        typeof playerData.kdr !== 'number' ||
        !Number.isFinite( playerData.kdr )
      ) {
        continue;
      }

      const formattedKDR = playerData.kdr.toFixed( 2 );
      let badge = badgesContainer.querySelector( '.gc-kdr-team-badge' );

      if ( !badge ) {
        badge = document.createElement( 'span' );
        badge.className = 'gc-kdr-team-badge';
        badge.dataset.kdr = formattedKDR;
        badge.title = `KDR: ${formattedKDR}`;
        badge.textContent = formattedKDR;
        badgesContainer.appendChild( badge );
      } else {
        if ( badge.dataset.kdr !== formattedKDR ) {
          badge.dataset.kdr = formattedKDR;
          badge.textContent = formattedKDR;
        }
        const titleAttr = `KDR: ${formattedKDR}`;
        if ( badge.title !== titleAttr ) {
          badge.title = titleAttr;
        }
        if ( badgesContainer.lastElementChild !== badge ) {
          badgesContainer.appendChild( badge );
        }
      }

      if ( element.dataset.gcKdr !== formattedKDR ) {
        element.dataset.gcKdr = formattedKDR;
      }
      const pid = playerData.id || id || '';
      if ( pid && element.dataset.gcPlayerId !== pid ) {
        element.dataset.gcPlayerId = pid;
      }
    }
  }

  function calculateRoomAverage( cardElement ) {
    const playerElements = cardElement.querySelectorAll( PLAYER_SELECTOR );
    if ( !playerElements.length ) { return null; }

    let total = 0;
    let count = 0;
    const processed = new Set();

    for ( let i = 0; i < playerElements.length; i++ ) {
      const el = playerElements[i];
      if ( processed.has( el ) ) { continue; }
      processed.add( el );

      let kdrValue = el.dataset?.gcKdr;

      if ( !kdrValue ) {
        const badge = el.querySelector( '.gc-kdr-badge' );
        kdrValue = badge?.dataset?.kdr || badge?.textContent?.trim();
      }

      if ( kdrValue ) {
        const parsed = Number.parseFloat( String( kdrValue ).replace( ',', '.' ) );
        if ( !Number.isNaN( parsed ) && Number.isFinite( parsed ) && parsed > 0 ) {
          total += parsed;
          count++;
        }
      }
    }

    if ( !count ) { return null; }
    return total / count;
  }

  function renderRoomAverageBadge( cardElement, averageKDR ) {
    const cardHeader = cardElement.matches( '.CardHeader' ) ? cardElement : cardElement.querySelector( '.CardHeader' );
    const titleRow = cardElement.querySelector( '.CardHeader__title-row' );
    const title = cardElement.querySelector(
      '.CardHeader__title, h1.CardHeader__title, .LobbyRoom__title, .RoomCard__title, [class*="CardHeader__title"], [class*="RoomTitle"]'
    );

    if ( !title && !titleRow && !cardHeader ) { return; }

    const formatted = averageKDR.toFixed( 2 );
    let badge = cardElement.querySelector( '.gc-kdr-room-badge' );

    if ( !badge ) {
      badge = document.createElement( 'div' );
      badge.className = 'gc-kdr-room-badge';
      badge.dataset.kdr = formatted;
      badge.title = `KDR Médio: ${formatted}`;
      badge.textContent = formatted;

      if ( titleRow ) {
        titleRow.style.display = 'flex';
        titleRow.style.alignItems = 'center';
        titleRow.style.width = '100%';
        titleRow.appendChild( badge );
      } else if ( title ) {
        title.insertAdjacentElement( 'afterend', badge );
      } else if ( cardHeader ) {
        const info = cardHeader.querySelector( '.CardHeader__info' ) || cardHeader;
        info.appendChild( badge );
      }
    } else {
      if ( badge.dataset.kdr !== formatted ) {
        badge.dataset.kdr = formatted;
        badge.textContent = formatted;
      }
      const titleAttr = `KDR Médio: ${formatted}`;
      if ( badge.title !== titleAttr ) {
        badge.title = titleAttr;
      }
    }
  }

  function updateRoomAverageKDR() {
    if ( !monitorActive ) { return; }

    const processedCards = new Set();

    // 1. Cards com .CardHeader
    const headers = document.querySelectorAll( '.CardHeader' );
    headers.forEach( header => {
      const card = header.closest(
        '[id^="roomCardWrapper-"], .RoomCardWrapper, [class*="RoomCard"], [class*="LobbyCard"], [class*="CardWrapper"], [class*="Card"]'
      ) || header.closest( '#lobbies-wrapper > div' ) || header.parentElement;

      if ( !card || processedCards.has( card ) ) { return; }
      processedCards.add( card );

      const avg = calculateRoomAverage( card );
      if ( avg !== null ) {
        renderRoomAverageBadge( card, avg );
      }
    } );

    // 2. Cards com seletores clássicos
    const traditionalCards = document.querySelectorAll(
      '[id^="roomCardWrapper-"], .RoomCardWrapper, [class*="RoomCard"]:not([class*="RoomCardWrapper"] [class*="RoomCard"])'
    );
    traditionalCards.forEach( card => {
      if ( processedCards.has( card ) ) { return; }
      processedCards.add( card );

      const avg = calculateRoomAverage( card );
      if ( avg !== null ) {
        renderRoomAverageBadge( card, avg );
      }
    } );

    // 3. Desafios / Challenges (cards com .LobbyChallengeCard__item)
    const challengeItems = document.querySelectorAll( '.LobbyChallengeCard__item' );
    challengeItems.forEach( item => {
      const avg = calculateRoomAverage( item );
      if ( avg !== null ) {
        renderRoomAverageBadge( item, avg );
      }
    } );

    // 4. Listagem de desafios (<li id="challenge_{roomId}">)
    updateChallengeListKDR();
  }

  /**
   * Exibe o KDR médio na listagem de desafios:
   * - Elemento: <li id="challenge_{roomId}">
   * - Posicionamento: após .styles_level__fnBMT, antes de .styles_title__GSzXq
   * - Reutiliza a média já calculada a partir do roomStore.
   */
  function updateChallengeListKDR() {
    if ( !monitorActive ) { return; }

    const rows = document.querySelectorAll( 'li[id^="challenge_"]' );
    if ( !rows.length ) { return; }

    rows.forEach( row => {
      const rawId = row.id.replace( 'challenge_', '' );
      if ( !rawId ) { return; }

      const room = roomStore.get( rawId );
      const players = room?.players;
      if ( !players || !players.length ) { return; }

      let total = 0;
      let count = 0;
      players.forEach( p => {
        if ( typeof p.kdr === 'number' && Number.isFinite( p.kdr ) && p.kdr > 0 ) {
          total += p.kdr;
          count++;
        }
      } );

      if ( !count ) { return; }

      const avg = total / count;
      const formatted = avg.toFixed( 2 );

      let badge = row.querySelector( '.gc-kdr-room-badge' );

      if ( !badge ) {
        badge = document.createElement( 'span' );
        badge.className = 'gc-kdr-room-badge';
        badge.dataset.kdr = formatted;
        badge.title = `KDR Médio: ${formatted}`;
        badge.textContent = formatted;

        const levelSpan = row.querySelector( '.styles_level__fnBMT, [class*="styles_level__"]' );
        if ( levelSpan ) {
          levelSpan.insertAdjacentElement( 'afterend', badge );
        } else {
          row.prepend( badge );
        }
      } else {
        if ( badge.dataset.kdr !== formatted ) {
          badge.dataset.kdr = formatted;
          badge.textContent = formatted;
        }
        const titleAttr = `KDR Médio: ${formatted}`;
        if ( badge.title !== titleAttr ) {
          badge.title = titleAttr;
        }
      }
    } );
  }

  /**
   * Agrupa e despacha atualizações visuais via requestAnimationFrame.
   */
  function scheduleKDRUpdate() {
    if ( rafPending || !monitorActive ) { return; }
    rafPending = true;

    requestAnimationFrame( () => {
      rafPending = false;
      updatePlayerKDR();
      updateTeamPlayerKDR();
      updateRoomAverageKDR();
    } );
  }

  function startDOMObserver() {
    if ( !monitorActive || !document.body || domObserver ) { return; }

    injectStyles();

    domObserver = new MutationObserver( () => scheduleKDRUpdate() );
    domObserver.observe( document.body, {
      childList: true,
      subtree: true
    } );

    debugLog( '[GC] Observador DOM iniciado.' );
  }

  function stopDOMObserver() {
    if ( domObserver ) {
      domObserver.disconnect();
      domObserver = null;
    }
    rafPending = false;
  }

  // ==========================================
  // PROCESSAMENTO HTTP
  // ==========================================

  function processHTTPResponse( data, url ) {
    if ( !monitorActive || !url || !url.includes( API_URL ) ) { return; }

    if (
      !data ||
      data.success !== true ||
      !data.lobbyList ||
      !data.lobbyList.lobbys
    ) {
      return;
    }

    let totalRooms = 0;
    let totalPlayers = 0;

    Object.entries( data.lobbyList.lobbys ).forEach( ( [ roomId, room ] ) => {
      const players = Object.entries( room.members || {} ).map(
        ( [ playerId, member ] ) => {
          const kdrRaw = ( member.kdr !== null && member.kdr !== undefined ) ? Number( member.kdr ) : null;
          const levelRaw = ( member.level !== null && member.level !== undefined ) ? Number( member.level ) : null;

          return {
            id: String( playerId ),
            name: member.nick || null,
            avatar: member.avatar || null,
            steam_id: member.steamId64 || null,
            level: ( levelRaw !== null && Number.isFinite( levelRaw ) && levelRaw >= 0 ) ? levelRaw : null,
            kdr: ( kdrRaw !== null && Number.isFinite( kdrRaw ) && kdrRaw >= 0 ) ? kdrRaw : null,
            country: member.country || null,
            isPrime: member.isPrime,
            isVerified: member.isVerified,
            isOfficial: member.isOfficial,
            isPro: member.isPro,
            isPremium: member.isPremium,
            isPlus: member.isPlus,
            medalha_id: member.medalha_id,
            medalha_name: member.medalha_name,
            firepower: member.firepower,
            teamwork: member.teamwork,
            playerFrame: member.playerFrame,
            matchmakingLevel: member.matchmakingLevel,
            currentSeasonPosition: member.currentSeasonPosition
          };
        }
      );

      mergeRoom( roomId, players, {
        source: 'http',
        isSnapshot: true,
        game: room.game,
        region: room.region,
        map: null,
        admin_id: room.idadmin,
        hasPassword: room.hasPassword,
        minLevelToJoin: room.minLevelToJoin,
        maxLevelToJoin: room.maxLevelToJoin,
        level: room.level,
        numberOfPlayers: room.numberOfPlayers,
        preVetoedMaps: room.preVetoedMaps,
        timeElapsedSinceCreatedAt: room.timeElapsedSinceCreatedAt
      } );

      totalRooms++;
      totalPlayers += players.length;
    } );

    debugGroup(
      '%c[GC] Dados iniciais recebidos via HTTP',
      'color:#16a34a;font-weight:bold'
    );
    debugLog( 'Endpoint:', url );
    debugLog( 'Salas:', totalRooms );
    debugLog( 'Jogadores:', totalPlayers );
    debugLog( 'Dados estruturados:', window.gcRoomData );
    debugGroupEnd();

    scheduleKDRUpdate();
  }

  // ==========================================
  // INTEGRAÇÃO COM DECODER WEBSOCKET
  // ==========================================

  function onSocketMessage( result, url ) {
    if ( !monitorActive ) { return; }

    const roomId = result.room_id;
    if ( !roomId ) { return; }

    // Cada pacote Protobuf de sala representa a lista completa de membros naquele instante
    mergeRoom( roomId, result.players, {
      source: 'websocket',
      isSnapshot: true,
      game: result.game,
      map: result.map
    } );

    debugGroup(
      `%c[GC] Sala atualizada via WebSocket | ${roomId}`,
      'color:#3b82f6;font-weight:bold'
    );
    debugLog( 'WebSocket:', url );
    debugLog( 'JSON estruturado:' );
    debugLog( JSON.stringify( result, null, 2 ) );
    if ( isDebug() ) { console.table( result.players ); }
    debugGroupEnd();
  }

  const socketDecoder = new GCSocketDecoder( {
    onMessage: onSocketMessage,
    debug: isDebug()
  } );

  const processFrame = ( buf, url ) => {
    if ( !monitorActive ) { return; }

    if ( typeof socketDecoder.processFrame === 'function' ) {
      socketDecoder.processFrame( buf, url );
    } else if ( typeof socketDecoder._handleBuffer === 'function' ) {
      socketDecoder._handleBuffer( buf, url );
    }
  };

  function attachSocket( socket ) {
    if ( !socket || monitoredSockets.has( socket ) ) { return; }
    monitoredSockets.add( socket );

    originalAddEventListener.call( socket, 'message', event => {
      if ( !monitorActive ) { return; }

      if ( event.data instanceof ArrayBuffer ) {
        processFrame( event.data, socket.url );
      } else if ( event.data instanceof Blob ) {
        event.data.arrayBuffer()
          .then( buffer => processFrame( buffer, socket.url ) )
          .catch( err => debugLog( '[GC] Falha na conversão de Blob:', err ) );
      }
    } );

    debugLog( '[GC] WebSocket monitorado:', socket.url );
  }

  // ==========================================
  // INSTALAÇÃO / REMOÇÃO DE INTERCEPTAÇÕES
  // ==========================================

  function installInterceptors() {
    if ( interceptorsInstalled ) { return; }
    interceptorsInstalled = true;

    // 1. Fetch
    window.fetch = async function ( ...args ) {
      const response = await originalFetch.apply( this, args );

      if ( monitorActive ) {
        try {
          const requestURL = new URL(
            args[0] instanceof Request ? args[0].url : args[0],
            location.href
          );

          if (
            requestURL.pathname.includes( API_URL ) &&
            requestURL.searchParams.get( 'region' ) === REGION
          ) {
            response.clone().json()
              .then( data => processHTTPResponse( data, requestURL.href ) )
              .catch( err => debugLog( '[GC] Erro ao ler HTTP:', err ) );
          }
        } catch ( error ) {
          debugLog( '[GC] Interceptação fetch:', error );
        }
      }

      return response;
    };
    gcFetch = window.fetch;

    // 2. XMLHttpRequest
    XMLHttpRequest.prototype.open = function ( method, url, ...args ) {
      this.__gcURL = new URL( url, location.href ).href;
      return originalOpen.call( this, method, url, ...args );
    };
    gcXHROpen = XMLHttpRequest.prototype.open;

    XMLHttpRequest.prototype.send = function ( ...args ) {
      this.addEventListener( 'load', function () {
        if ( !monitorActive ) { return; }

        try {
          const url = new URL( this.__gcURL );

          if (
            url.pathname.includes( API_URL ) &&
            url.searchParams.get( 'region' ) === REGION
          ) {
            processHTTPResponse(
              JSON.parse( this.responseText ),
              this.__gcURL
            );
          }
        } catch ( error ) {
          debugLog( '[GC] Erro ao processar XHR:', error );
        }
      } );

      return originalSend.apply( this, args );
    };
    gcXHRSend = XMLHttpRequest.prototype.send;

    // 3. WebSocket Proxy
    MonitoredWebSocket = new Proxy( OriginalWebSocket, {
      construct( target, args, newTarget ) {
        const socket = Reflect.construct( target, args, newTarget );
        if ( monitorActive ) {
          attachSocket( socket );
        }
        return socket;
      }
    } );
    window.WebSocket = MonitoredWebSocket;
  }

  function uninstallInterceptors() {
    if ( !interceptorsInstalled ) { return; }

    // Restaura WebSocket se ainda for o nosso Proxy
    if ( window.WebSocket === MonitoredWebSocket ) {
      window.WebSocket = OriginalWebSocket;
    }

    // Restaura fetch apenas se a função atual for exatamente a que instalamos
    if ( window.fetch === gcFetch ) {
      window.fetch = originalFetch;
    }

    // Restaura XMLHttpRequest apenas se as funções atuais forem as nossas
    if ( XMLHttpRequest.prototype.open === gcXHROpen ) {
      XMLHttpRequest.prototype.open = originalOpen;
    }
    if ( XMLHttpRequest.prototype.send === gcXHRSend ) {
      XMLHttpRequest.prototype.send = originalSend;
    }

    interceptorsInstalled = false;
    gcFetch = null;
    gcXHROpen = null;
    gcXHRSend = null;
  }

  // ==========================================
  // CONTROLE DO MONITOR (API PÚBLICA)
  // ==========================================

  window.gcMonitor = {
    /**
     * Inicializa ou reativa o monitor de forma idempotente.
     */
    start() {
      if ( monitorActive ) {
        debugWarn( '[GC] Monitor já está ativo.' );
        return;
      }

      monitorActive = true;
      installInterceptors();

      if ( document.body ) {
        startDOMObserver();
      } else if ( !pendingDOMListener ) {
        pendingDOMListener = () => {
          pendingDOMListener = null;
          if ( monitorActive ) { startDOMObserver(); }
        };
        document.addEventListener( 'DOMContentLoaded', pendingDOMListener, { once: true } );
      }

      console.log( '%c[GC] Monitor iniciado!', 'color:#16a34a;font-weight:bold' );
    },

    /**
     * Desativa o monitor com segurança e de forma idempotente.
     */
    stop() {
      if ( !monitorActive && !interceptorsInstalled ) {
        debugWarn( '[GC] Monitor já está desativado.' );
        return;
      }

      monitorActive = false;

      // Remove listener de DOMContentLoaded pendente se houver
      if ( pendingDOMListener ) {
        document.removeEventListener( 'DOMContentLoaded', pendingDOMListener );
        pendingDOMListener = null;
      }

      stopDOMObserver();
      uninstallInterceptors();
      clearDOMBadges();
      removeStyles();

      // Limpeza dos dados globais conforme especificação
      window.gcRoomData = null;
      roomStore.clear();

      debugLog( '[GC] Monitor desativado.' );
    },

    /** Força atualização dos badges KDR na tela */
    update() {
      updatePlayerKDR();
      updateTeamPlayerKDR();
      updateRoomAverageKDR();
      debugLog( '[GC] Interface atualizada.' );
    },

    /** Retorna todas as salas armazenadas */
    getRooms() {
      return Array.from( roomStore.values() );
    },

    /** Retorna todos os jogadores de todas as salas */
    getPlayers() {
      return window.gcRoomData?.players || [];
    },

    /** Retorna uma sala específica pelo ID */
    getRoom( roomId ) {
      return roomStore.get( String( roomId ) ) || null;
    },

    /** Informa se o monitor está ativo */
    isActive() {
      return monitorActive;
    }
  };

  // ==========================================
  // AUTO-INICIALIZAÇÃO
  // ==========================================

  window.gcMonitor.start();

} )();
