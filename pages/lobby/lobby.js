let opcoes = {};
chrome.storage.sync.get(['autoAceitarPreReady', 'autoCopiarIp', 'autoAceitarReady', 'autoConcordarTermosRanked', 'autoFixarMenuLobby', 'autoEsconderBotaoSuporte'], function (result) {
    opcoes = result;
    initLobby();
});

const initLobby = () => {
    if (opcoes.autoAceitarPreReady) {
        const intervalAceitar = setInterval(function () {
            const buttonAceitar = document.getElementById('playNowOverlayReady');
            if (buttonAceitar && buttonAceitar.textContent === 'Ready' && !buttonAceitar.disabled) {
                buttonAceitar.click();
            }
        }, 5000);
    }
    if (opcoes.autoCopiarIp) {
        const intervalCopia = setInterval(function () {
            const buttonCopia = document.getElementById('gameModalCopyServer');
            if (buttonCopia && buttonCopia.textContent === 'Copiar IP') {
                buttonCopia.click();
            }
        }, 5000);
    }
    if (opcoes.autoAceitarReady) {
        const intervalAceitar = setInterval(function () {
            const buttonReady = $('#gameModalReadyBtn> button');
            if (buttonReady && !buttonReady.disabled) {
                buttonReady.click();
            }
        }, 5000);
    }
    if (opcoes.autoFixarMenuLobby) {
        if (document.styleSheets.length == 0) {
            document.head.appendChild(document.createElement("style"));
        }
        document.styleSheets[0].insertRule("#SidebarSala {position: fixed; top: 10%;}");
    }
    if (opcoes.autoEsconderBotaoSuporte) {
        if (document.styleSheets.length == 0) {
            document.head.appendChild(document.createElement("style"));
        }
        document.styleSheets[0].insertRule("#js-mdLauncherWidget {display: none}");
    }

    //Auto concordar com termos da ranked.
    $('#rankedqualifyModal, #rankedopenModal, #rankedproModal, #rankedchallengeModal').on('transitionend', concordarTermos);
};

function concordarTermos(e) {
    if (opcoes.autoConcordarTermosRanked && $('ranked-modal-agree').is(':visible')) {
        if (!['rankedqualifyModal', 'rankedopenModal', 'rankedproModal', 'rankedchallengeModal'].includes(e.target.id)) return;
        if (!e.target.classList.contains('game-modal-fade-in')) return;
        const metodo = $('.ranked-modal-agree>a').attr('onclick');
        location.href = `${metodo}; void 0`;
    }
}
