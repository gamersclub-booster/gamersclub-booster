let opcoes = {};
chrome.storage.sync.get(['autoAceitarPreReady', 'autoCopiarIp', 'autoAceitarReady', 'autoConcordarTermosRanked', 'autoFixarMenuLobby'], function (result) {
    opcoes = result;
    initLobby();
});

let intervalCriarLobby = null
let lobbyCriada = false

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

        preReadyObserver.observe($('#rankedModals').get(0), {
            childList: true,
            subtree: true
        })
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

        copyIpObserver.observe($('#rankedModals').get(0), {
            childList: true,
            subtree: true
        })
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

        readyObserver.observe($('#rankedModals').get(0), {
            childList: true,
            subtree: true
        })
    }
    if (opcoes.autoFixarMenuLobby) {
        let observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (!mutation.addedNodes) return

                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    let node = mutation.addedNodes[i]
                    if (typeof node.id != 'undefined') {
                        if (node.id.includes("SidebarSala")) {
                            $(node).css({
                                position: "fixed",
                                top: "10%",
                                bottom: "auto"
                            });
                        }
                        if (node.className.includes("sidebar-desafios sidebar-content")) {
                            $(node).css({
                                position: 'fixed',
                                top: '10%',
                                right: '72px',
                                bottom: 'auto'
                            });
                        }
                    }
                }
            })
        });

        observer.observe($('#lobbyContent').get(0), {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
        })
    }

    //Auto concordar com termos da ranked.
    $('#rankedqualifyModal, #rankedopenModal, #rankedproModal, #rankedchallengeModal').on('transitionend', concordarTermos);

    //Feature pra criar lobby caso full
    $('#lobbyContent > div.row.lobby-rooms-content > div > div > div:nth-child(3)').html('<button id="forcarCriacaoLobbyBtn" style="color:orange" type="button">Forçar Criação da Lobby</button>')
    document.getElementById("forcarCriacaoLobbyBtn").addEventListener("click", function () {
        lobbyCriada = false;
        intervalCriarLobby = intervalerCriacaoLobby();
    });
};
//Criar lobby: https://github.com/LouisRiverstone/gamersclub-lobby_waiter/ com as modificações por causa do layout novo
function intervalerCriacaoLobby() {
    log('aaa');
    return setInterval(() => {
        if (!lobbyCriada) {
            const lobbies = $("span.Tag__tagLabel.Tag__tagLabel--success").text().split('/');
            //Em contato com a GC, falaram que ta variando entre 50 e 100 =(
            if (lobbies[1] < 50) {
                $('button.WasdButton.WasdButton--success.WasdButton--lg.LobbyHeaderButton').click()
                
                const antiCheat = $(".noty_bar.noty_type__info.noty_theme__mint.noty_close_with_click.noty_has_timeout.noty_close_with_button");
                if (antiCheat.length && antiCheat.text() === "Você precisa estar com o jogo CS:GO e o Gamers Club Anti-cheat abertos para jogar. Clique aqui para baixar o GamersClub Anti-cheat.Está com o jogo e o anti-cheat abertos e ainda encontra dificuldades para jogar? Clique aqui.×") {
                    clearInterval(intervalCriarLobby);
                    return;
                }

                const botaoCriarSala = $(".WasdButton.WasdButton--success.WasdButton--lg.CreateLobbyModalFooterButton.CreateLobbyModalFooterButton--create");
                if (botaoCriarSala && botaoCriarSala.text() === "Criar Sala") {
                    //TODO: Adicionar opções de pre veto
                    
                    //Espera criar o modal... Verificar depois disso se criou mesmo, mas pra isso preciso testar em uma conta free quando tiver lotado....
                    setTimeout(() => {
                        $(".CheckboxContainer__input").click();
                        botaoCriarSala.click();
                        lobbyCriada = true;
                        clearInterval(intervalCriarLobby);
                    }, 300);
                }
            }
        } else {
            clearInterval(intervalCriarLobby)
        }
    }, 100)
}

function concordarTermos(e) {
    if (opcoes.autoConcordarTermosRanked && $('ranked-modal-agree').is(':visible')) {
        if (!['rankedqualifyModal', 'rankedopenModal', 'rankedproModal', 'rankedchallengeModal'].includes(e.target.id)) return;
        if (!e.target.classList.contains('game-modal-fade-in')) return;
        const metodo = $('.ranked-modal-agree>a').attr('onclick');
        location.href = `${metodo}; void 0`;
    }
}