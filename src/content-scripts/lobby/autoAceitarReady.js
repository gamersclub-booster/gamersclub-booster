/*
 * O que esse arquivo faz:
 * Controla o AutoReady principal da GC usando um delay configuravel de 0 a 10 segundos.
 *
 * Como ele funciona:
 * - 0 segundos significa aceite automatico com 1ms.
 * - 1 a 10 segundos abrem popup, iniciam countdown e permitem decisao manual.
 * - A sessao atual do Ready fica congelada ate a ocorrencia terminar.
 * - Mudancas no slider durante um countdown so valem para o proximo Ready.
 *
 * Riscos de onde mexer:
 * - O botao Ready pode ser rerenderizado pela GC no meio da ocorrencia.
 * - Observer e interval consultam o mesmo fluxo e podem criar race condition.
 * - Um reset errado pode vazar override manual, popup ou delay para a proxima partida.
 *
 * Limitacoes conhecidas:
 * - A deteccao do Ready ainda depende de texto no botao.
 * - A microcopy nova ainda nao esta integrada ao sistema de traducoes da extensao.
 */

// Vulnerability note:
// Ready detection still relies on button text matching.
// If GamersClub changes the label, language, or DOM structure,
// auto ready and the delay popup may stop working or target the wrong button.
const READY_SELECTOR = 'button:contains("Ready")';
const READY_POPUP_ID = 'gc-booster-ready-delay-popup';
const READY_POPUP_STYLE_ID = 'gc-booster-ready-delay-popup-style';
const READY_SESSION_RESET_GRACE_MS = 600;
const MANUAL_OVERRIDE_TTL_MS = 15000;

const readySession = {
  activeReadyElement: null,
  pendingAcceptTimeout: null,
  pendingPopupElement: null,
  pendingCountdownInterval: null,
  manualOverrideUntil: 0,
  autoAccepted: false,
  sessionToken: 0,
  delaySeconds: null,
  countdownEndsAt: null,
  readyAbsentSince: null
};

let readySessionCounter = 0;

function getAutoReadySettings( callback ) {
  chrome.storage.sync.get( [
    'autoAceitarReady',
    'autoAceitarReadyDelaySeconds'
  ], callback );
}

function getDelaySeconds( settings ) {
  return Math.min( Math.max( Number( settings.autoAceitarReadyDelaySeconds ?? 0 ), 0 ), 10 );
}

function getReadyButton() {
  return $( READY_SELECTOR ).filter( ( _index, element ) => {
    return !element.disabled;
  } ).first();
}

function clearPendingAcceptTimeout() {
  if ( readySession.pendingAcceptTimeout ) {
    clearTimeout( readySession.pendingAcceptTimeout );
    readySession.pendingAcceptTimeout = null;
  }
}

function clearPendingCountdownInterval() {
  if ( readySession.pendingCountdownInterval ) {
    clearInterval( readySession.pendingCountdownInterval );
    readySession.pendingCountdownInterval = null;
  }
}

function removeReadyPopup() {
  if ( readySession.pendingPopupElement ) {
    readySession.pendingPopupElement.remove();
    readySession.pendingPopupElement = null;
  }
}

function clearPendingDelayArtifacts() {
  clearPendingAcceptTimeout();
  clearPendingCountdownInterval();
  removeReadyPopup();
  readySession.countdownEndsAt = null;
}

function resetReadySession() {
  // Limpeza total da ocorrencia atual. Sempre que uma nova partida nascer, ou quando
  // a ocorrencia anterior realmente acabar, este eh o ponto que deve encerrar popup,
  // countdown, timeout e estado congelado.
  clearPendingDelayArtifacts();
  readySession.activeReadyElement = null;
  readySession.manualOverrideUntil = 0;
  readySession.autoAccepted = false;
  readySession.delaySeconds = null;
  readySession.readyAbsentSince = null;
}

function ensureReadyPopupStyles() {
  if ( document.getElementById( READY_POPUP_STYLE_ID ) ) {
    return;
  }

  const style = document.createElement( 'style' );
  style.id = READY_POPUP_STYLE_ID;
  style.textContent = `
    #${READY_POPUP_ID} {
      position: fixed;
      right: 24px;
      bottom: 24px;
      width: 320px;
      padding: 16px;
      border: 1px solid rgba(36, 126, 185, 0.75);
      border-radius: 8px;
      background: rgba(20, 21, 38, 0.96);
      color: #ffffff;
      z-index: 999999;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
      font-family: Poppins, sans-serif;
    }
    #${READY_POPUP_ID} .gc-booster-ready-title {
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 6px;
    }
    #${READY_POPUP_ID} .gc-booster-ready-subtitle {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 12px;
    }
    #${READY_POPUP_ID} .gc-booster-ready-actions {
      display: flex;
      gap: 8px;
    }
    #${READY_POPUP_ID} .gc-booster-ready-button {
      flex: 1;
      border: 0;
      border-radius: 4px;
      padding: 10px 12px;
      color: #ffffff;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      transition: 0.2s ease-out;
    }
    #${READY_POPUP_ID} .gc-booster-ready-button--manual {
      background: rgba(244, 67, 54, 0.92);
    }
    #${READY_POPUP_ID} .gc-booster-ready-button--manual:hover {
      background: rgba(188, 39, 28, 0.95);
    }
    #${READY_POPUP_ID} .gc-booster-ready-button--auto {
      background: rgba(36, 126, 185, 0.92);
    }
    #${READY_POPUP_ID} .gc-booster-ready-button--auto:hover {
      background: rgba(27, 99, 146, 0.95);
    }
  `;

  document.head.appendChild( style );
}

function isTrackedReadyStillValid() {
  if ( !readySession.activeReadyElement ) {
    return false;
  }

  return document.body.contains( readySession.activeReadyElement ) && !readySession.activeReadyElement.disabled;
}

function hasActiveManualOverride() {
  return Date.now() < readySession.manualOverrideUntil;
}

function hasOngoingReadySession() {
  return Boolean(
    readySession.pendingAcceptTimeout ||
    readySession.pendingPopupElement ||
    hasActiveManualOverride()
  );
}

function bindReadySession( readyButton, delaySeconds ) {
  const readyElement = readyButton.get( 0 );

  if ( readySession.activeReadyElement === readyElement ) {
    readySession.readyAbsentSince = null;
    return;
  }

  // Se a GC apenas rerenderizou o mesmo Ready durante a janela atual, preservamos
  // a sessão em andamento para não reiniciar o countdown nem reabrir popup.
  if ( readySession.activeReadyElement && hasOngoingReadySession() ) {
    readySession.activeReadyElement = readyElement;
    readySession.readyAbsentSince = null;
    return;
  }

  clearPendingDelayArtifacts();
  readySession.activeReadyElement = readyElement;
  readySession.sessionToken = ++readySessionCounter;
  readySession.autoAccepted = false;
  // O delay da ocorrencia fica congelado no nascimento da sessao.
  // Se o slider mudar depois disso, a nova configuracao so vale para o proximo Ready.
  readySession.delaySeconds = delaySeconds;
  readySession.readyAbsentSince = null;
}

function updatePopupCountdown() {
  if ( !readySession.pendingPopupElement || !readySession.countdownEndsAt ) {
    return;
  }

  const countdownNode = readySession.pendingPopupElement.find( '[data-role="countdown"]' );
  const remainingMs = Math.max( readySession.countdownEndsAt - Date.now(), 0 );
  const remainingSeconds = Math.max( Math.ceil( remainingMs / 1000 ), 0 );
  countdownNode.text( `${remainingSeconds}s` );
}

function attemptReadyAcceptance( sessionToken ) {
  if ( sessionToken !== readySession.sessionToken ) {
    return;
  }

  if ( hasActiveManualOverride() || readySession.autoAccepted ) {
    return;
  }

  if ( !isTrackedReadyStillValid() ) {
    resetReadySession();
    return;
  }

  clearPendingDelayArtifacts();
  readySession.autoAccepted = true;
  $( readySession.activeReadyElement )[0].click();
}

function scheduleReadyAcceptance( sessionToken, delayMs ) {
  clearPendingAcceptTimeout();
  readySession.pendingAcceptTimeout = setTimeout( () => {
    readySession.pendingAcceptTimeout = null;
    attemptReadyAcceptance( sessionToken );
  }, delayMs );
}

function renderReadyPopup( sessionToken, delaySeconds ) {
  ensureReadyPopupStyles();
  removeReadyPopup();

  const popup = $( `
    <div id="${READY_POPUP_ID}">
      <div class="gc-booster-ready-title">Aceitar automaticamente esta partida?</div>
      <div class="gc-booster-ready-subtitle">
        Você pode decidir manualmente nos próximos <strong data-role="countdown">${delaySeconds}s</strong>.
      </div>
      <div class="gc-booster-ready-actions">
        <button type="button" class="gc-booster-ready-button gc-booster-ready-button--manual" data-action="manual">
          Decidir manualmente
        </button>
        <button type="button" class="gc-booster-ready-button gc-booster-ready-button--auto" data-action="auto">
          Aceitar automático
        </button>
      </div>
    </div>
  ` );

  popup.find( '[data-action="manual"]' ).on( 'click', () => {
    if ( sessionToken !== readySession.sessionToken ) {
      return;
    }

    readySession.manualOverrideUntil = Date.now() + MANUAL_OVERRIDE_TTL_MS;
    clearPendingDelayArtifacts();
  } );

  popup.find( '[data-action="auto"]' ).on( 'click', () => {
    if ( sessionToken !== readySession.sessionToken ) {
      return;
    }

    attemptReadyAcceptance( sessionToken );
  } );

  $( 'body' ).append( popup );
  readySession.pendingPopupElement = popup;
  readySession.countdownEndsAt = Date.now() + ( delaySeconds * 1000 );
  updatePopupCountdown();

  clearPendingCountdownInterval();
  readySession.pendingCountdownInterval = setInterval( () => {
    if ( sessionToken !== readySession.sessionToken ) {
      clearPendingCountdownInterval();
      return;
    }

    if ( !isTrackedReadyStillValid() ) {
      resetReadySession();
      return;
    }

    updatePopupCountdown();
  }, 250 );
}

function ensureDelayedAcceptance( delaySeconds, delayMs ) {
  if ( hasActiveManualOverride() || readySession.autoAccepted || readySession.pendingAcceptTimeout ) {
    return;
  }

  renderReadyPopup( readySession.sessionToken, delaySeconds );
  scheduleReadyAcceptance( readySession.sessionToken, delayMs );
}

function processAutoReady( settings ) {
  if ( !settings.autoAceitarReady ) {
    resetReadySession();
    return;
  }

  const readyButton = getReadyButton();
  if ( !readyButton.length ) {
    if ( !readySession.readyAbsentSince ) {
      readySession.readyAbsentSince = Date.now();
      return;
    }

    if ( Date.now() - readySession.readyAbsentSince >= READY_SESSION_RESET_GRACE_MS ) {
      resetReadySession();
    }
    return;
  }

  // Se o Ready ficou ausente tempo suficiente e voltou, tratamos como uma nova ocorrência.
  // Isso evita que a escolha manual anterior ou o delay antigo vazem para a próxima partida.
  if ( readySession.readyAbsentSince &&
    Date.now() - readySession.readyAbsentSince >= READY_SESSION_RESET_GRACE_MS ) {
    resetReadySession();
  }

  const configuredDelaySeconds = getDelaySeconds( settings );
  bindReadySession( readyButton, configuredDelaySeconds );

  if ( !isTrackedReadyStillValid() ) {
    resetReadySession();
    return;
  }

  if ( hasActiveManualOverride() || readySession.autoAccepted ) {
    return;
  }

  // O delay da ocorrência atual fica congelado quando a sessão começa.
  // Se o usuário mover o slider durante o countdown, a nova configuração passa a valer
  // somente para o próximo Ready.
  const delaySeconds = readySession.delaySeconds ?? configuredDelaySeconds;
  const effectiveDelayMs = delaySeconds === 0 ? 1 : delaySeconds * 1000;

  if ( delaySeconds > 0 ) {
    ensureDelayedAcceptance( delaySeconds, effectiveDelayMs );
    return;
  }

  // Contrato do produto:
  // - slider 0 => aceite automatico com 1ms
  // - slider 1..10 => popup + countdown + escolha manual
  clearPendingDelayArtifacts();

  if ( readySession.pendingAcceptTimeout ) {
    return;
  }

  scheduleReadyAcceptance( readySession.sessionToken, effectiveDelayMs );
}

export const autoAceitarReady = _mutations =>
  getAutoReadySettings( processAutoReady );

export function autoAceitarReadySetInterval() {
  setInterval( () => {
    getAutoReadySettings( processAutoReady );
  }, 300 );
}

export function resetAutoAceitarReadyState() {
  resetReadySession();
}
