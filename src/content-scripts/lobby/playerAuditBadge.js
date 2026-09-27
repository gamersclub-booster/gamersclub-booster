import { auditPlayers, RISK_LEVEL } from '../../lib/playerAudit';

const BADGE_CONFIG = {
  [RISK_LEVEL.CLEAN]: { css: 'gcbooster-audit-badge--clean', icon: '✓', label: 'Limpo' },
  [RISK_LEVEL.SUSPECT]: { css: 'gcbooster-audit-badge--suspect', icon: '⚠', label: 'Suspeito' },
  [RISK_LEVEL.BANNED]: { css: 'gcbooster-audit-badge--banned', icon: '✕', label: 'Banido' }
};

const SELECTOR = '[id^="trigger-"], a.LobbyPlayerVertical, .sala-lineup-imagem a';

function extractPlayerId( element ) {
  if ( element.id && element.id.startsWith( 'trigger-' ) ) {
    return element.id.replace( 'trigger-', '' );
  }
  const href = element.getAttribute( 'href' ) || $( element ).find( 'a' ).attr( 'href' );
  if ( href ) {
    const match = href.match( /\/(?:jogador|player)\/(\d+)/i );
    if ( match ) {
      return match[1];
    }
    const parts = href.split( '/' ).filter( Boolean );
    const last = parts[parts.length - 1];
    if ( /^\d+$/.test( last ) ) {
      return last;
    }
  }
  return null;
}

function renderBadge( element, playerAudit ) {
  if ( !playerAudit || playerAudit.error ) { return; }

  const config = BADGE_CONFIG[playerAudit.riskLevel] || BADGE_CONFIG[RISK_LEVEL.CLEAN];

  // 1. Criar badge de risco
  const playerId = playerAudit.gcId;
  const $badge = $( '<div/>', {
    class: `gcbooster-audit-badge gcbooster-audit-${playerId} ${config.css}`,
    title: config.label
  } ).text( config.icon );

  // 2. Criar tooltip com dados detalhados
  const $tooltip = buildTooltip( playerAudit );
  $badge.append( $tooltip );

  // 3. Criar botão csREP (link direto)
  const $csrepBtn = $( '<a/>', {
    class: `gcbooster-csrep-btn gcbooster-csrep-${playerId}`,
    href: playerAudit.csrepUrl || '#',
    target: '_blank',
    title: 'Abrir Raio-X completo no csREP (Trust Score, Demo AI, Anomalias)',
    rel: 'noopener noreferrer'
  } ).html( '🔍 csREP' );

  // 4. Inserção no DOM:
  if ( element.id && element.id.startsWith( 'trigger-' ) ) {
    const $card = $( element ).closest(
      '[class*="PlayerCard"], .PlayerListCard, .LobbyChallengeLineUpCard, .sala-lineup-jogadores'
    );

    let $target = $card.find( '.PlayerIdentityBadges' );
    if ( !$target.length ) {
      $target = $card.find(
        '[class*="PlayerIdentityNickname__userInformations"], [class*="PlayerIdentityNickname"], .PlayerIdentity'
      );
    }
    if ( !$target.length ) {
      $target = $( element ).parent();
    }

    if ( $target.length ) {
      $target.find( `.gcbooster-audit-${playerId}, .gcbooster-csrep-${playerId}` ).remove();
      $target.append( $badge );
      if ( playerAudit.csrepUrl ) {
        $target.append( $csrepBtn );
      }
    }
  } else {
    const $challengeWrap = $( '<div/>', {
      class: 'gcbooster-challenge-audit-wrap'
    } );

    $challengeWrap.append( $badge );
    if ( playerAudit.csrepUrl ) {
      $challengeWrap.append( $csrepBtn );
    }

    $( element ).find( '.gcbooster-challenge-audit-wrap' ).remove();

    const $kdr = $( element ).find( '#gcbooster_kdr' );
    if ( $kdr.length ) {
      $kdr.after( $challengeWrap );
    } else {
      $( element ).prepend( $challengeWrap );
    }
  }
}

function injectAuditButton( $container, onAudit, isAutoMode = false ) {
  if ( !$container || !$container.length || $container.find( '.gcbooster-audit-refresh' ).length ) {
    return;
  }

  const initialText = isAutoMode ? '🔄' : '🛡️ Raio-X';
  const initialTitle = isAutoMode ? 'Atualizar Raio-X' : 'Auditar jogadores da sala (Raio-X)';

  const $btn = $( '<button/>', {
    class: 'gcbooster-audit-refresh',
    title: initialTitle,
    text: initialText
  } );

  $btn.on( 'click', async e => {
    e.preventDefault();
    e.stopPropagation();
    if ( $btn.hasClass( 'loading' ) ) { return; }

    $btn.addClass( 'loading' );
    $container.addClass( 'gcbooster-audit-requested' );
    $btn.html( '⏳' );
    try {
      await onAudit( $container );
    } finally {
      setTimeout( () => {
        $btn.removeClass( 'loading' );
        $btn.html( '🔄' ).attr( 'title', 'Atualizar Raio-X' );
      }, 500 );
    }
  } );

  const $lupa = $container.find( '.gcbooster_lupa' );
  if ( $lupa.length ) {
    $lupa.after( $btn );
  } else {
    $container.prepend( $btn );
  }
}

export const playerAuditBadge = () => {
  chrome.storage.sync.get( [ 'playerAuditEnabled' ], result => {
    if ( result.playerAuditEnabled === false ) { return; }

    const handleRoomAudit = async $container => {
      const playerElements = $container.find( SELECTOR ).toArray();
      const playerIds = [];

      playerElements.forEach( el => {
        const id = extractPlayerId( el );
        if ( id ) { playerIds.push( id ); }
        delete el.dataset.gcboosterAuditProcessed;
      } );

      $container.find( '.gcbooster-audit-badge, .gcbooster-csrep-btn, .gcbooster-challenge-audit-wrap' ).remove();

      if ( playerIds.length > 0 && chrome.runtime?.sendMessage ) {
        await new Promise( resolve => {
          chrome.runtime.sendMessage( {
            action: 'INVALIDATE_AUDIT_CACHE',
            steamIds: playerIds
          }, () => resolve() );
        } );
      }

      processElements();
    };

    const processElements = () => {
      const lobbies = {};

      $( SELECTOR ).each( ( _, element ) => {
        if ( element.dataset.gcboosterAuditProcessed ) { return; }

        const playerId = extractPlayerId( element );
        if ( !playerId ) { return; }

        const $lobbyContainer = $( element ).closest(
          '[id^="roomCardWrapper-"], .LobbyChallengeLineUpCard, .sala-card, [id^="lobby-"], .MatchCard, .DraftContainer'
        );

        const isTrigger = element.id && element.id.startsWith( 'trigger-' );
        const isRequested = $lobbyContainer.length && $lobbyContainer.hasClass( 'gcbooster-audit-requested' );
        const isAuto = isTrigger || isRequested || $lobbyContainer.hasClass( 'MatchCard' ) || $lobbyContainer.hasClass( 'DraftContainer' );

        let roomKey = 'default';
        if ( $lobbyContainer.length ) {
          let roomId = $lobbyContainer.attr( 'id' );
          if ( !roomId ) {
            if ( !$lobbyContainer[0].dataset.gcboosterRoomId ) {
              $lobbyContainer[0].dataset.gcboosterRoomId = `room-${Math.random().toString( 36 ).slice( 2, 9 )}`;
            }
            roomId = $lobbyContainer[0].dataset.gcboosterRoomId;
          }
          roomKey = roomId;
        }

        element.dataset.gcboosterAuditProcessed = 'pending';

        if ( !lobbies[roomKey] ) {
          lobbies[roomKey] = {
            container: $lobbyContainer.length ? $lobbyContainer : null,
            items: [],
            isAuto: false
          };
        }
        if ( isAuto ) { lobbies[roomKey].isAuto = true; }
        lobbies[roomKey].items.push( { element, playerId } );
      } );

      // Processar cada sala
      Object.values( lobbies ).forEach( ( { container, items, isAuto } ) => {
        if ( container && !isAuto ) {
          injectAuditButton( container, handleRoomAudit, false );
          items.forEach( ( { element } ) => {
            element.dataset.gcboosterAuditProcessed = 'ready';
          } );
          return;
        }

        if ( container ) {
          injectAuditButton( container, handleRoomAudit, true );
        }

        const playerIds = [ ...new Set( items.map( item => item.playerId ) ) ];
        if ( playerIds.length === 0 ) { return; }

        auditPlayers( playerIds )
          .then( results => {
            if ( !Array.isArray( results ) ) { return; }
            items.forEach( ( { element, playerId } ) => {
              element.dataset.gcboosterAuditProcessed = 'true';
              const playerAudit = results.find( r => r && String( r.gcId ) === String( playerId ) );
              if ( playerAudit && !playerAudit.error ) {
                renderBadge( element, playerAudit );
              }
            } );
            if ( container ) {
              const btn = container.find( '.gcbooster-audit-refresh' );
              if ( btn.length ) {
                btn.html( '🔄' ).attr( 'title', 'Atualizar Raio-X' );
              }
            }
          } )
          .catch( err => {
            console.error( '[GC-BOOSTER] Erro no batch audit de jogadores:', err );
            items.forEach( ( { element } ) => {
              delete element.dataset.gcboosterAuditProcessed;
            } );
          } );
      } );
    };

    // Executar imediatamente e monitorar mutações
    processElements();
    const observer = new MutationObserver( () => processElements() );
    observer.observe( document.body, { childList: true, subtree: true } );
  } );
};

function buildTooltip( audit ) {
  let profileVisibilityLabel = '❓ Desconhecido';
  if ( audit.profileVisibility === 'public' || audit.profileVisibility === 3 ) {
    profileVisibilityLabel = '🔓 Público';
  } else if ( audit.profileVisibility === 'private' || audit.profileVisibility === 1 ) {
    profileVisibilityLabel = '🔒 Privado';
  } else if ( audit.profileVisibility === 'friendsonly' ) {
    profileVisibilityLabel = '👥 Apenas Amigos';
  }

  const displayName = audit.personaName || 'Jogador';

  const lines = [
    `<div class="gcbooster-audit-tooltip-title">🛡️ Raio-X — ${displayName}</div>`,
    '<div class="gcbooster-audit-tooltip-section">',
    '  <span class="gcbooster-audit-tooltip-label">Steam Level:</span>',
    `  <span>${audit.steamLevel !== null && audit.steamLevel !== undefined ? `Nível ${audit.steamLevel}` : 'Não informado'}</span>`,
    '</div>',
    '<div class="gcbooster-audit-tooltip-section">',
    '  <span class="gcbooster-audit-tooltip-label">Conta Limitada:</span>',
    `  <span>${audit.isLimitedAccount ? '⚠️ Sim (Limitada)' : 'Não'}</span>`,
    '</div>',
    '<div class="gcbooster-audit-tooltip-section">',
    '  <span class="gcbooster-audit-tooltip-label">VAC Ban:</span>',
    `  <span>${audit.vacBanned ? '❌ SIM' : '✅ Nenhum'}</span>`,
    '</div>',
    '<div class="gcbooster-audit-tooltip-section">',
    '  <span class="gcbooster-audit-tooltip-label">Trade Ban:</span>',
    `  <span>${audit.economyBan && audit.economyBan !== 'None' && audit.economyBan !== 'none' ? `❌ ${audit.economyBan}` : '✅ Nenhum'}</span>`,
    '</div>',
    '<div class="gcbooster-audit-tooltip-section">',
    '  <span class="gcbooster-audit-tooltip-label">Perfil:</span>',
    `  <span>${profileVisibilityLabel}</span>`,
    '</div>'
  ];

  if ( audit.riskReasons?.length ) {
    lines.push( '<div class="gcbooster-audit-tooltip-divider"></div>' );
    audit.riskReasons.forEach( r => {
      lines.push( `<div class="gcbooster-audit-tooltip-reason">${r}</div>` );
    } );
  }

  lines.push( '<div class="gcbooster-audit-tooltip-divider"></div>' );
  lines.push( '<div class="gcbooster-audit-tooltip-csrep">🔍 Clique no botão csREP para auditoria completa com IA</div>' );

  return $( '<div/>', {
    class: 'gcbooster-audit-tooltip',
    html: lines.join( '' )
  } );
}
