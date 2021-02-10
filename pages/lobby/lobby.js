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
                var selector = "#setPlayerReady";
                var filteredEls = addedNodes.find(selector).addBack(selector);
                filteredEls.each(() => {
                    console.log(filteredEls);
                    filteredEls[0].click();
                });
            });
        });

        preReadyObserver.observe($(document.body).get(0), { childList: true, subtree: true })
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
        let readyObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (!mutation.addedNodes) return

                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    $('#gameModalReadyBtn > button').click(); // TODO - Fazer da mesma forma que o preReady
                }
            })
        });

        readyObserver.observe($('#lobbyModal').get(0), { childList: true, subtree: true })
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
