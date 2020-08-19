let options = {};
chrome.storage.sync.get(['autoAceitarPreReady', 'autoCopiarIp'], function (result) {
    options = result;
    initLobby();
});

const initLobby = () => {
    if ( options.autoAceitarPreReady ) {
        const intervalAceitar = setInterval(function() {
            const buttonAceitar = document.getElementById('playNowOverlayReady');
            if (buttonAceitar && buttonAceitar.textContent === 'Ready') {
                buttonAceitar.click();
            }
        }, 5000);
    }
    if ( options.autoCopiarIp ) {
        const intervalCopia = setInterval(function() {
            const buttonCopia = document.getElementById('gameModalCopyServer');
            if (buttonCopia && buttonCopia.textContent === 'Copiar IP') {
                buttonCopia.click();
            }
        }, 5000);
    }
};
//game-modal-ready-button e ready
///<button class="game-modal-command-btn" id="gameModalCopyServer" data-clipboard-text="connect 45.164.124.56:20117;password GC5072" title="Clique para copiar" data-jsaction="gcCommonTooltip" data-tip-text="Clique para copiar">IP Copiado</button>