let opcoes = {};
chrome.storage.sync.get(
    null,
    function (result) {
        opcoes = result;
        initLobby();
    }
);

let intervalCriarLobby = null;
let lobbyCriada = false;

const initLobby = () => {
    if (opcoes.autoAceitarPreReady) {
        let preReadyObserver = new MutationObserver((mutations) => {
            $.each(mutations, (i, mutation) => {
                var addedNodes = $(mutation.addedNodes);
                let selector = '#setPlayerReady';
                var preReadyButton = addedNodes.find(selector).addBack(selector);
                if (preReadyButton.length) {
                    preReadyButton[0].click();
                    if (opcoes.somPreReady) {
                        const som = opcoes.somPreReady === 'custom' ? opcoes.customSomPreReady : opcoes.somPreReady;
                        const audio = new Audio(som);
                        audio.volume = opcoes.volume/100;
                        audio.play();
                    }
                }
            });
        });

        preReadyObserver.observe($('#rankedModals').get(0), {
            childList: true,
            subtree: true,
        });
    }

    if (opcoes.autoCopiarIp) {
        const intervalCopia = setInterval(function () {
            const buttonCopia = document.getElementById('gameModalCopyServer');
            if (buttonCopia && buttonCopia.textContent === 'Copiar IP') {
                buttonCopia.click();
            }
        }, 500);
    }


    if (opcoes.autoAceitarReady) {
        let readyObserver = new MutationObserver((mutations) => {
            $.each(mutations, (i, mutation) => {
                var addedNodes = $(mutation.addedNodes);
                let selector = '#gameModalReadyBtn > button';
                var readyButton = addedNodes.find(selector).addBack(selector);
                if (readyButton.length && readyButton.text() === "Ready") {
                    readyButton[0].click();
                    if (opcoes.somReady) {
                        const som = opcoes.somReady === 'custom' ? opcoes.customSomReady : opcoes.somReady;
                        const audio = new Audio(som);
                        audio.volume = opcoes.volume/100;
                        audio.play();
                    }
                }
            });
        });

        readyObserver.observe($('#rankedModals').get(0), {
            childList: true,
            subtree: true,
        });
    }
    if (opcoes.autoFixarMenuLobby) {
        let freeuser = document.getElementsByClassName("SettingsMenu SettingsMenu--free");
        let observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (!mutation.addedNodes) return;

                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    let node = mutation.addedNodes[i];
                    if (typeof node.id != 'undefined') {
                        if (node.id.includes('SidebarSala')) {
                            if (freeuser) {
                                $(node).css({
                                    position: 'fixed',
                                    top: '130px',
                                    bottom: 'auto',
                                });
                            }
                            else {
                                $(node).css({
                                    position: 'fixed',
                                    top: '10%',
                                    bottom: 'auto',
                                });
                            }
                        }
                        if (node.className.includes('sidebar-desafios sidebar-content')) {
                            if (freeuser) {
                                $(node).css({
                                    position: 'fixed',
                                    top: '130px',
                                    right: '72px',
                                    bottom: 'auto',
                                });
                            }
                            else {
                                $(node).css({
                                    position: 'fixed',
                                    top: '10%',
                                    right: '72px',
                                    bottom: 'auto',
                                });
                            }
                        }
                    }
                }
            });
        });

        observer.observe($('#lobbyContent').get(0), {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false,
        });
    }

    if (opcoes.autoConcordarTermosRanked) {
        let termosRankedObserver = new MutationObserver((mutations) => {
            $.each(mutations, (i, mutation) => {
                const addedNodes = $(mutation.addedNodes);
                let selector = '.ranked-modal-agree.container-fluid > a';
                const concordarButton = addedNodes.find(selector).addBack(selector);
                if (concordarButton.length) {
                    concordarButton[0].click();
                }
            });
        });

        termosRankedObserver.observe($('#rankedModals').get(0), {
            childList: true,
            subtree: true,
        });
    }

    //Feature pra criar lobby caso full
    adicionarBotaoForcarCriarLobby();
};
function adicionarBotaoCancelarCriarLobby() {
    $('#lobbyContent > div.row.lobby-rooms-content > div > div > div:nth-child(3)').html(
        '<span style="color:orange">FORÇANDO CRIAÇÃO DA LOBBY...</span><button id="cancelarCriacaoLobbyBtn" style="color:red" type="button">Cancelar</button>'
    );
    document.getElementById('cancelarCriacaoLobbyBtn').addEventListener('click', function () {
        clearInterval(intervalCriarLobby);
        adicionarBotaoForcarCriarLobby();
    });
}

function adicionarBotaoForcarCriarLobby() {
    $('#lobbyContent > div.row.lobby-rooms-content > div > div > div:nth-child(3)').html(
        '<button id="forcarCriacaoLobbyBtn" style="color:orange" type="button">Forçar Criação da Lobby</button>'
    );
    document.getElementById('forcarCriacaoLobbyBtn').addEventListener('click', function () {
        lobbyCriada = false;
        intervalCriarLobby = intervalerCriacaoLobby();
        adicionarBotaoCancelarCriarLobby();
    });
}
//Criar lobby: https://github.com/LouisRiverstone/gamersclub-lobby_waiter/ com as modificações por causa do layout novo
function intervalerCriacaoLobby() {
    return setInterval(async () => {
        if (!lobbyCriada || $('.sidebar-titulo.sidebar-sala-titulo').text().length) {
            const lobbies = $(".LobbiesInfo__expanded > .Tag > .Tag__tagLabel")[0].innerText.split('/')[1];
            const windowVars = retrieveWindowVariables(["LOBBIES_LIMIT"]);
            const limiteLobby = windowVars.LOBBIES_LIMIT;
            if (Number(lobbies) < Number(limiteLobby)) {
                //Criar lobby por meio de requisição com AXIOS. ozKcs
                chrome.storage.sync.get(["preVetos"], async res => {
                    const preVetos = res.preVetos ? res.preVetos : [];
                    const postData = {
                        "max_level_to_join":20,
                        "min_level_to_join":0,
                        "private":0,
                        "region":0,
                        "restriction":1,
                        "team":null,
                        "team_players":[],
                        "type":"newRoom",
                        "vetoes": preVetos
                    }
                    const criarPost = await axios.post("/lobbyBeta/createLobby", postData);
                    if (criarPost.data.success) {
                        const loadLobby = await axios.post("/lobbyBeta/openRoom");
                        if (loadLobby.data.success) {
                            lobbyCriada = true;
                            location.href="javascript:openLobby(); void 0";
                            setTimeout(async () => {
                                lobbyCriada = true;
                                adicionarBotaoForcarCriarLobby();
                                clearInterval(intervalCriarLobby);
                            }, 1000);
                        }
                    } else {
                        if (criarPost.data.message.includes("Anti-cheat")) {
                            clearInterval(intervalCriarLobby);
                            adicionarBotaoForcarCriarLobby();
                            location.href=`javascript:errorAlert('${criarPost.data.message}'); void 0`;
                            return;
                        }
                    }
                })
            }
        } else {
            adicionarBotaoForcarCriarLobby();
            clearInterval(intervalCriarLobby);
        }
    }, 500);
}
