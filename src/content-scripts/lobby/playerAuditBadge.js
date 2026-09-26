import { auditPlayers, RISK_LEVEL } from '../../lib/playerAudit';

const BADGE_CONFIG = {
  [RISK_LEVEL.CLEAN]: { css: 'gcbooster-audit-badge--clean', icon: '✓', label: 'Limpo' },
  [RISK_LEVEL.SUSPECT]: { css: 'gcbooster-audit-badge--suspect', icon: '⚠', label: 'Suspeito' },
  [RISK_LEVEL.BANNED]: { css: 'gcbooster-audit-badge--banned', icon: '✕', label: 'Banido' },
  [RISK_LEVEL.CONFIG]: { css: 'gcbooster-audit-badge--config', icon: '🛡️', label: 'Audit' }
};

export const playerAuditBadge = () => {
  chrome.storage.sync.get( [ 'playerAuditEnabled' ], result => {
    // Ativado por padrão (se não for explicitamente desativado)
    if ( result.playerAuditEnabled === false ) { return; }

    const processElements = () => {
      // 1. Jogadores no lobby/draft (cards principais)
      // 2. Jogadores em salas para desafiar e lobbies (LobbyPlayerVertical e lineups)
      const selector = '[id^="trigger-"], a.LobbyPlayerVertical, .sala-lineup-imagem a';

      $( selector ).each( ( _, element ) => {
        if ( element.dataset.gcboosterAuditProcessed ) { return; }
        element.dataset.gcboosterAuditProcessed = 'true';

        let playerId = null;
        if ( element.id && element.id.startsWith( 'trigger-' ) ) {
          playerId = element.id.replace( 'trigger-', '' );
        } else {
          const href = element.getAttribute( 'href' ) || $( element ).find( 'a' ).attr( 'href' );
          if ( href ) {
            const match = href.match( /\/(?:jogador|player)\/(\d+)/i );
            if ( match ) {
              playerId = match[1];
            } else {
              const parts = href.split( '/' ).filter( Boolean );
              const last = parts[parts.length - 1];
              if ( /^\d+$/.test( last ) ) { playerId = last; }
            }
          }
        }

        if ( !playerId ) { return; }

        ( async () => {
          try {
            const audit = await auditPlayers( [ playerId ] );
            if ( !audit?.[0] || audit[0].error ) { return; }

            const playerAudit = audit[0];
            const config = BADGE_CONFIG[playerAudit.riskLevel] || BADGE_CONFIG[RISK_LEVEL.CONFIG];

            // 1. Criar badge de risco
            const $badge = $( '<div/>', {
              class: `gcbooster-audit-badge ${config.css}`,
              title: config.label
            } ).text( config.icon );

            // 2. Criar tooltip com dados detalhados
            const $tooltip = buildTooltip( playerAudit );
            $badge.append( $tooltip );

            // 3. Criar botão csREP (link direto)
            const $csrepBtn = $( '<a/>', {
              class: 'gcbooster-csrep-btn',
              href: playerAudit.csrepUrl || '#',
              target: '_blank',
              title: 'Abrir Raio-X completo no csREP (Trust Score, Demo AI, Anomalias)',
              rel: 'noopener noreferrer'
            } ).html( '🔍 csREP' );

            // 4. Inserção no DOM:
            if ( element.id && element.id.startsWith( 'trigger-' ) ) {
              // Card principal do lobby/draft
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
                $target.append( $badge );
                if ( playerAudit.csrepUrl ) {
                  $target.append( $csrepBtn );
                }
              }
            } else {
              // Card de jogador em salas para desafiar (LobbyPlayerVertical)
              const $challengeWrap = $( '<div/>', {
                class: 'gcbooster-challenge-audit-wrap'
              } );

              $challengeWrap.append( $badge );
              if ( playerAudit.csrepUrl ) {
                $challengeWrap.append( $csrepBtn );
              }

              const $kdr = $( element ).find( '#gcbooster_kdr' );
              if ( $kdr.length ) {
                $kdr.after( $challengeWrap );
              } else {
                $( element ).prepend( $challengeWrap );
              }
            }
          } catch ( err ) {
            console.error( '[GC-BOOSTER] Erro ao processar player audit:', err );
          }
        } )();
      } );
    };

    // Executar imediatamente e monitorar mutações
    processElements();
    const observer = new MutationObserver( () => processElements() );
    observer.observe( document.body, { childList: true, subtree: true } );
  } );
};

function buildTooltip( audit ) {
  if ( audit.noApiKey ) {
    return $( '<div/>', {
      class: 'gcbooster-audit-tooltip',
      html: [
        '<div class="gcbooster-audit-tooltip-title">🛡️ GC Booster — Player Audit</div>',
        '<div class="gcbooster-audit-tooltip-section">',
        '  <span>🔍 Clique em <strong>csREP</strong> para ver a análise completa por IA!</span>',
        '</div>',
        '<div class="gcbooster-audit-tooltip-divider"></div>',
        '<div class="gcbooster-audit-tooltip-csrep">💡 Dica: Adicione sua Steam Web API Key nas opções ' +
        'da extensão para ver VAC bans e horas aqui no lobby.</div>'
      ].join( '' )
    } );
  }

  const accountAge = audit.accountCreated ?
    new Date( audit.accountCreated * 1000 ).toLocaleDateString( 'pt-BR' ) :
    'Desconhecido';

  const lines = [
    `<div class="gcbooster-audit-tooltip-title">🛡️ Raio-X — ${audit.personaName}</div>`,
    '<div class="gcbooster-audit-tooltip-section">',
    '  <span class="gcbooster-audit-tooltip-label">Steam:</span>',
    `  <span>Conta de ${accountAge} | Lvl ${audit.steamLevel ?? '?'} | ${audit.cs2Hours ?? '?'}h CS2</span>`,
    '</div>',
    '<div class="gcbooster-audit-tooltip-section">',
    '  <span class="gcbooster-audit-tooltip-label">VAC Ban:</span>',
    `  <span>${audit.vacBanned ? `❌ SIM (${audit.numberOfVACBans}x, há ${audit.daysSinceLastBan} dias)` : '✅ Nenhum'}</span>`,
    '</div>',
    '<div class="gcbooster-audit-tooltip-section">',
    '  <span class="gcbooster-audit-tooltip-label">Game Ban:</span>',
    `  <span>${audit.numberOfGameBans > 0 ? `❌ SIM (${audit.numberOfGameBans}x)` : '✅ Nenhum'}</span>`,
    '</div>',
    '<div class="gcbooster-audit-tooltip-section">',
    '  <span class="gcbooster-audit-tooltip-label">Perfil:</span>',
    `  <span>${audit.profileVisibility === 3 ? '🔓 Público' : '🔒 Privado'}</span>`,
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
