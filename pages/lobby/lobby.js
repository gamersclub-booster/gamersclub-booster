let opcoes = {};
chrome.storage.sync.get(['autoAceitarPreReady', 'autoCopiarIp', 'autoAceitarReady', 'autoConcordarTermosRanked', 'autoFixarMenuLobby'], function (result) {
    opcoes = result;
    initLobby();
});

const initLobby = () => {
    if (opcoes.autoAceitarPreReady) {
        let preReadyObserver = new MutationObserver((mutations) => {
            $.each(mutations, (i, mutation) => {
                var addedNodes = $(mutation.addedNodes);
                let selector = '#setPlayerReady';
                var preReadyButton = addedNodes.find(selector).addBack(selector);
                if (preReadyButton.length) {
                    preReadyButton[0].click();
                }
            });
        });

        preReadyObserver.observe($('#rankedModals').get(0), { childList: true, subtree: true })
    }
    if (opcoes.autoCopiarIp) {
        let copyIpObserver = new MutationObserver((mutations) => {
            $.each(mutations, (i, mutation) => {
                var addedNodes = $(mutation.addedNodes);
                let selector = '#gameModalCopyServer';
                var copyIpButton = addedNodes.find(selector).addBack(selector);
                if (copyIpButton.length) {
                    copyIpButton[0].click();
                }
            });
        });

        copyIpObserver.observe($('#rankedModals').get(0), { childList: true, subtree: true })
    }
    if (opcoes.autoAceitarReady) {
        let readyObserver = new MutationObserver((mutations) => {
            $.each(mutations, (i, mutation) => {
                var addedNodes = $(mutation.addedNodes);
                let selector = '#gameModalReadyBtn > button';
                var readyButton = addedNodes.find(selector).addBack(selector);
                if (readyButton.length) {
                    readyButton[0].click();
                }
            });
        });

        readyObserver.observe($('#rankedModals').get(0), { childList: true, subtree: true })
    }
    if (opcoes.autoFixarMenuLobby) {
        let observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (!mutation.addedNodes) return

                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    let node = mutation.addedNodes[i]
                    if (typeof node.id != 'undefined') {
                        if (node.id.includes("SidebarSala")) {
                            $(node).css({ position: "fixed", top: "10%", bottom: "auto" });
                        }
                        if (node.className.includes("sidebar-desafios sidebar-content")) {
                            $(node).css({ position: 'fixed', top: '10%', right: '72px', bottom: 'auto' });
                        }
                    }
                }
            })
        });

        observer.observe($('#lobbyContent').get(0), { childList: true, subtree: true, attributes: false, characterData: false })
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
