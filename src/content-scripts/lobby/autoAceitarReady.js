/*
 * O que esse arquivo faz: controla o auto aceite do Ready da GC, incluindo o modo instantaneo
 * e o modo com delay/popup para o usuario decidir se quer assumir manualmente aquela ocorrencia.
 * Como ele funciona: mantem uma sessao local do botao Ready atual, evita timers/popup duplicados,
 * aplica o delay configurado e limpa o estado quando a ocorrencia termina ou muda de contexto.
 * Riscos de onde mexer: a sessao local depende de timing, rerender do DOM e polling existente.
 * Alteracoes sem cuidado aqui podem rearmar o Ready apos decisao manual, duplicar popup ou aceitar
 * a partida na ocorrencia errada.
 */

// Vulnerability note:
// Ready detection still relies on button text matching.
// If GamersClub changes the label, language, or DOM structure,
// auto ready and the delay popup may stop working or target the wrong button.
// Keep this selector isolated here so it can be replaced safely.
const READY_SELECTOR = 'button:contains("Ready")';
const READY_POPUP_ID = 'gc-booster-ready-delay-popup';
const READY_POPUP_STYLE_ID = 'gc-booster-ready-delay-popup-style';
const READY_CLICK_DELAY_MS = 150;
const READY_SESSION_RESET_GRACE_MS = 600;
const MANUAL_OVERRIDE_TTL_MS = 15000;

const readySession = {
  activeReadyElement: null,
  pendingAcceptTimeout: null,
  pendingAcceptMode: null,
  pendingPopupElement: null,
  pendingCountdownInterval: null,
  manualOverrideUntil: 0,
  autoAccepted: false,
  sessionToken: 0,
  countdownEndsAt: null,
  readyAbsentSince: null
};

let readySessionCounter = 0;

function getAutoReadySettings( callback ) {
  chrome.storage.sync.get( [
    'autoAceitarReady',
    'autoAceitarReadyDelay5s',
    'autoAceitarReadyDelay10s'
  ], callback );
}

function getDelayMs( settings ) {
  if ( settings.autoAceitarReadyDelay5s ) {
    return 5000;
  }

  if ( settings.autoAceitarReadyDelay10s ) {
    return 10000;
  }

  return 0;
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
  readySession.pendingAcceptMode = null;
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
  if ( readySession.pendingAcceptMode === 'delay' ) {
    clearPendingAcceptTimeout();
  }
  clearPendingCountdownInterval();
  removeReadyPopup();
  readySession.countdownEndsAt = null;
}

function resetReadySession() {
  clearPendingDelayArtifacts();
  readySession.activeReadyElement = null;
  readySession.manualOverrideUntil = 0;
  readySession.autoAccepted = false;
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

function bindReadySession( readyButton ) {
  const readyElement = readyButton.get( 0 );

  if ( readySession.activeReadyElement === readyElement ) {
    // O que essa linha de codigo faz: zera o marcador de ausencia quando o mesmo botao
    // continua valido no DOM.
    // Como afeta o programa: evita resetar a sessao atual por engano enquanto a mesma
    // ocorrencia de Ready ainda esta viva.
    readySession.readyAbsentSince = null;
    return;
  }

  // O que essa linha de codigo faz: limpa somente artefatos temporarios do delay/popup
  // antes de associar a sessao a um novo elemento Ready.
  // Como afeta o programa: permite sobreviver a rerenders do mesmo estado de Ready sem
  // transformar a escolha manual do usuario em um reset total da sessao.
  clearPendingDelayArtifacts();
  readySession.activeReadyElement = readyElement;
  readySession.sessionToken = ++readySessionCounter;
  readySession.autoAccepted = false;
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

  const readyButton = $( readySession.activeReadyElement );
  readyButton[0].click();
}

function scheduleReadyAcceptance( sessionToken, delayMs, mode ) {
  clearPendingAcceptTimeout();
  readySession.pendingAcceptMode = mode;
  readySession.pendingAcceptTimeout = setTimeout( () => {
    readySession.pendingAcceptTimeout = null;
    readySession.pendingAcceptMode = null;
    attemptReadyAcceptance( sessionToken );
  }, delayMs );
}

function renderReadyPopup( sessionToken, delayMs ) {
  ensureReadyPopupStyles();
  removeReadyPopup();

  const popup = $( `
    <div id="${READY_POPUP_ID}">
      <div class="gc-booster-ready-title">Aceitar automaticamente esta partida?</div>
      <div class="gc-booster-ready-subtitle">
        Você pode decidir manualmente nos próximos <strong data-role="countdown">${Math.ceil( delayMs / 1000 )}s</strong>.
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

    // O que essa linha de codigo faz: cria uma janela temporaria em que o auto aceite
    // fica proibido para esta ocorrencia, mesmo se a GC rerenderizar o botao.
    // Como afeta o programa: respeita a decisao do usuario de assumir manualmente sem
    // desativar a feature para as proximas partidas.
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
  readySession.countdownEndsAt = Date.now() + delayMs;
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

function ensureDelayedAcceptance( delayMs ) {
  if ( hasActiveManualOverride() || readySession.autoAccepted || readySession.pendingAcceptTimeout ) {
    return;
  }

  renderReadyPopup( readySession.sessionToken, delayMs );
  scheduleReadyAcceptance( readySession.sessionToken, delayMs, 'delay' );
}

function processAutoReady( settings ) {
  if ( !settings.autoAceitarReady ) {
    resetReadySession();
    return;
  }

  const readyButton = getReadyButton();
  if ( !readyButton.length ) {
    if ( !readySession.readyAbsentSince ) {
      // O que essa linha de codigo faz: marca quando o Ready deixou de existir no DOM.
      // Como afeta o programa: cria uma pequena janela de tolerancia para diferenciar
      // um rerender rapido de um fim real da ocorrencia.
      readySession.readyAbsentSince = Date.now();
      return;
    }

    if ( Date.now() - readySession.readyAbsentSince >= READY_SESSION_RESET_GRACE_MS ) {
      // O que essa linha de codigo faz: encerra completamente a sessao apos o Ready
      // ficar ausente pelo tempo minimo definido.
      // Como afeta o programa: permite que a proxima partida reative normalmente o fluxo
      // de popup/delay, sem manter a decisao manual presa para sempre.
      resetReadySession();
    }
    return;
  }

  bindReadySession( readyButton );

  if ( !isTrackedReadyStillValid() ) {
    resetReadySession();
    return;
  }

  if ( hasActiveManualOverride() || readySession.autoAccepted ) {
    return;
  }

  const delayMs = getDelayMs( settings );
  if ( delayMs > 0 ) {
    // O que essa linha de codigo faz: troca o fluxo legado instantaneo pelo fluxo hibrido
    // com countdown e popup de decisao.
    // Como afeta o programa: da ao usuario uma janela curta para assumir manualmente
    // antes do aceite automatico.
    ensureDelayedAcceptance( delayMs );
    return;
  }

  // O que essa linha de codigo faz: remove qualquer popup ou countdown pendente quando
  // o usuario nao escolheu um modo de delay.
  // Como afeta o programa: preserva o comportamento antigo de auto aceite rapido e evita
  // lixo visual vindo de uma configuracao anterior.
  clearPendingDelayArtifacts();

  if ( readySession.pendingAcceptTimeout ) {
    return;
  }

  scheduleReadyAcceptance( readySession.sessionToken, READY_CLICK_DELAY_MS, 'click' );
}

export const autoAceitarReady = _mutations =>
  getAutoReadySettings( processAutoReady );

export function autoAceitarReadySetInterval() {
  setInterval( () => {
    // O que essa linha de codigo faz: revalida periodicamente a existencia do Ready e o
    // estado salvo da feature.
    // Como afeta o programa: garante que o fluxo continue funcionando mesmo quando o
    // observer nao captura a mudanca de DOM sozinho.
    getAutoReadySettings( processAutoReady );
  }, 300 );
}

export function resetAutoAceitarReadyState() {
  resetReadySession();
}
