/**
 * ============================================================
 * @file        index.js (kdr-monitor)
 * @author      Caio Felipe
 * @version     1.0.0
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
const isDebug = () => Boolean( DEBUG || window.__GC_DEBUG__ );

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
  if ( window.gcMonitor ) {
    debugWarn( '[GC] Monitor já está ativo.' );
    return;
  }

  // ==========================================
  // CONFIGURAÇÃO
  // ==========================================

  const API_URL = '/lobbyBeta/listRooms';
  const REGION = '27';

  const STYLE_ID = 'gc-kdr-monitor-style';
  const PLAYER_SELECTOR = '.LobbyRoom__lineup a.LobbyPlayerVertical';

  // ==========================================
  // INTERCEPTAÇÃO WEBSOCKET
  // (usa a WebSocket original antes de qualquer Proxy)
  // ==========================================

  const OriginalWebSocket = window.WebSocket;
  const originalAddEventListener = OriginalWebSocket.prototype.addEventListener;

  // ==========================================
  // ARMAZENAMENTO DOS DADOS
  // ==========================================

  const roomStore = new Map();

  function publishRoomData() {
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

    updatePlayerKDR();
  }

  function mergePlayer( oldPlayer, newPlayer ) {
    const merged = { ...oldPlayer };

    for ( const [ key, value ] of Object.entries( newPlayer ) ) {
      if ( value !== null && value !== undefined ) {
        merged[key] = value;
      }
    }

    return merged;
  }

  function mergeRoom( roomId, incomingPlayers, metadata = {} ) {
    const current = roomStore.get( String( roomId ) ) || {
      room_id: String( roomId ),
      players: []
    };

    const players = new Map(
      current.players.map( player => [
        String( player.id || player.steam_id || player.name ),
        player
      ] )
    );

    incomingPlayers.forEach( incoming => {
      const key = String( incoming.id || incoming.steam_id || incoming.name );
      const existing = players.get( key );

      players.set(
        key,
        existing ? mergePlayer( existing, incoming ) : incoming
      );
    } );

    roomStore.set( String( roomId ), {
      ...current,
      ...metadata,
      room_id: String( roomId ),
      players: Array.from( players.values() )
    } );

    publishRoomData();
  }

  // ==========================================
  // ESTILIZAÇÃO
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
                content: "KDR" !important;
                margin-right: 3px !important;
                color: #9ca3af !important;
                font-size: 8px !important;
            }
        `;

    document.head.appendChild( style );
  }

  // ==========================================
  // NORMALIZAÇÃO DOS JOGADORES
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
  // PROCESSAMENTO HTTP
  // ==========================================

  function processHTTPResponse( data, url ) {
    if ( !url || !url.includes( API_URL ) ) { return; }

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
        ( [ playerId, member ] ) => ( {
          id: String( playerId ),
          name: member.nick || null,
          avatar: member.avatar || null,
          steam_id: member.steamId64 || null,
          level: member.level !== null && member.level !== undefined ? Number( member.level ) : null,
          kdr: member.kdr !== null && member.kdr !== undefined ? Number( member.kdr ) : null,
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
        } )
      );

      mergeRoom( roomId, players, {
        source: 'http',
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

    console.group(
      '%c[GC] Dados iniciais recebidos via HTTP',
      'color:#16a34a;font-weight:bold'
    );
    console.log( 'Endpoint:', url );
    console.log( 'Salas:', totalRooms );
    console.log( 'Jogadores:', totalPlayers );
    console.log( 'Dados estruturados:', window.gcRoomData );
    console.groupEnd();

    updatePlayerKDR();
  }

  // ==========================================
  // INTERCEPTAÇÃO FETCH
  // ==========================================

  const originalFetch = window.fetch;

  window.fetch = async function ( ...args ) {
    const response = await originalFetch.apply( this, args );

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
          .catch( err => {
            if ( isDebug() ) { console.debug( '[GC] Erro ao ler HTTP:', err ); }
          } );
      }
    } catch ( error ) {
      if ( isDebug() ) { console.debug( '[GC] Interceptação fetch:', error ); }
    }

    return response;
  };

  // ==========================================
  // INTERCEPTAÇÃO XMLHttpRequest
  // ==========================================

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function ( method, url, ...args ) {
    this.__gcURL = new URL( url, location.href ).href;
    return originalOpen.call( this, method, url, ...args );
  };

  XMLHttpRequest.prototype.send = function ( ...args ) {
    this.addEventListener( 'load', function () {
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
        if ( isDebug() ) { console.debug( '[GC] Erro ao processar XHR:', error ); }
      }
    } );

    return originalSend.apply( this, args );
  };

  // ==========================================
  // INTEGRAÇÃO COM GCSocketDecoder
  // ==========================================

  function onSocketMessage( result, url ) {
    const roomId = result.room_id;
    if ( !roomId ) { return; }

    const current = roomStore.get( String( roomId ) );

    const mergedPlayers = result.players.map( player => {
      const existing = current?.players.find( item =>
        ( player.steam_id && item.steam_id === player.steam_id ) ||
                ( player.name && normalizeName( item.name ) === normalizeName( player.name ) )
      );

      return existing ? mergePlayer( existing, player ) : player;
    } );

    mergeRoom( roomId, mergedPlayers, {
      source: 'websocket',
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
    if ( isDebug() ) { console.table( mergedPlayers ); }
    debugGroupEnd();
  }

  const socketDecoder = new GCSocketDecoder( {
    onMessage: onSocketMessage,
    debug: isDebug()
  } );

  // ==========================================
  // WEBSOCKET MONITOR
  // ==========================================

  const monitored = new WeakSet();

  function attachSocket( socket ) {
    if ( monitored.has( socket ) ) { return; }
    monitored.add( socket );

    originalAddEventListener.call( socket, 'message', event => {
      if ( event.data instanceof ArrayBuffer ) {
        socketDecoder._handleBuffer( event.data, socket.url );

      } else if ( event.data instanceof Blob ) {
        event.data.arrayBuffer().then( buffer =>
          socketDecoder._handleBuffer( buffer, socket.url )
        );
      }
    } );

    debugLog( '[GC] WebSocket monitorado:', socket.url );
  }

  const MonitoredWebSocket = new Proxy( OriginalWebSocket, {
    construct( target, args, newTarget ) {
      const socket = Reflect.construct( target, args, newTarget );
      attachSocket( socket );
      return socket;
    }
  } );

  window.WebSocket = MonitoredWebSocket;

  // ==========================================
  // ATUALIZAÇÃO DOS KDR NO HTML
  // ==========================================

  function updatePlayerKDR() {
    if ( !window.gcRoomData ) { return; }

    const players = window.gcRoomData.players || [];
    if ( !players.length ) { return; }

    document.querySelectorAll( PLAYER_SELECTOR ).forEach( element => {
      const htmlName = getPlayerName( element );
      if ( !htmlName ) { return; }

      const normalizedHTMLName = normalizeName( htmlName );

      const playerData = players.find(
        player => normalizeName( player.name ) === normalizedHTMLName
      );

      if (
        !playerData ||
                typeof playerData.kdr !== 'number' ||
                !Number.isFinite( playerData.kdr )
      ) {
        return;
      }

      const avatarWrapper = element.querySelector(
        '[id^="player-trigger-wrapper-"]'
      );

      if ( !avatarWrapper ) { return; }

      let badge = avatarWrapper.querySelector( '.gc-kdr-badge' );

      if ( !badge ) {
        avatarWrapper.classList.add( 'gc-kdr-wrapper' );
        badge = document.createElement( 'span' );
        badge.className = 'gc-kdr-badge';
        avatarWrapper.appendChild( badge );
      }

      const formattedKDR = playerData.kdr.toFixed( 2 );

      if ( badge.dataset.kdr !== formattedKDR ) {
        badge.dataset.kdr = formattedKDR;
        badge.textContent = formattedKDR;
      }

      element.dataset.gcKdr = formattedKDR;
      element.dataset.gcPlayerId = playerData.id || '';
    } );
  }

  // ==========================================
  // OBSERVADOR DO DOM
  // ==========================================

  let domObserver = null;

  function startDOMObserver() {
    if ( !document.body || domObserver ) { return; }

    injectStyles();

    domObserver = new MutationObserver( () => updatePlayerKDR() );

    domObserver.observe( document.body, {
      childList: true,
      subtree: true
    } );

    debugLog( '[GC] Observador DOM iniciado.' );
  }

  if ( document.body ) {
    startDOMObserver();
  } else {
    document.addEventListener( 'DOMContentLoaded', startDOMObserver, { once: true } );
  }

  // ==========================================
  // CONTROLE DO MONITOR (API pública)
  // ==========================================

  window.gcMonitor = {
    update() {
      updatePlayerKDR();
      debugLog( '[GC] Interface atualizada.' );
    },
    getRooms() {
      return Array.from( roomStore.values() );
    },
    getPlayers() {
      return window.gcRoomData?.players || [];
    },
    getRoom( roomId ) {
      return roomStore.get( String( roomId ) ) || null;
    },
    stop() {
      if ( window.WebSocket === MonitoredWebSocket ) {
        window.WebSocket = OriginalWebSocket;
      }

      if ( window.fetch !== originalFetch ) {
        window.fetch = originalFetch;
      }

      XMLHttpRequest.prototype.open = originalOpen;
      XMLHttpRequest.prototype.send = originalSend;

      domObserver?.disconnect();
      domObserver = null;

      document.querySelectorAll( '.gc-kdr-badge' )
        .forEach( el => el.remove() );

      document.querySelectorAll( '.gc-kdr-wrapper' )
        .forEach( el => el.classList.remove( 'gc-kdr-wrapper' ) );

      document.getElementById( STYLE_ID )?.remove();

      delete window.gcMonitor;

      debugLog( '[GC] Monitor desativado.' );
    }
  };

  console.log( '%c[GC] Monitor iniciado!', 'color:#16a34a;font-weight:bold' );
} )();
