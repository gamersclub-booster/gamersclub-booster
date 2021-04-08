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

const initLobby = async () => {
    if (opcoes.autoCopiarIp) {
        const copiarIpFunc = mutations => $.each(mutations, async (i, mutation) => {
            var addedNodes = $(mutation.addedNodes);
            let selector = '#gameModalCopyServer';
            var ipInput = addedNodes.find(selector).addBack(selector);
            if (ipInput.length) {
                const IPSelector = "game-modal-command-input"
                const campoIP = document.getElementsByClassName(IPSelector)
                if (campoIP[0].value) {
                    const buttonCopia = document.getElementById('gameModalCopyServer');
                    if (buttonCopia && buttonCopia.textContent === 'Copiar IP') {
                        buttonCopia.click();
                    }
                }
            }
        });
        const copiarIP = criarObserver("#rankedModals", copiarIpFunc)
    }

    if (opcoes.somPreReady) {
        const somPreReadyFunc = mutations => $.each(mutations, (i, mutation) => {
            var addedNodes = $(mutation.addedNodes);
            let selector = '#setPlayerReady';
            var preReadyButton = addedNodes.find(selector).addBack(selector);
            if (preReadyButton.length) {
                const som = opcoes.somPreReady === 'custom' ? opcoes.customSomPreReady : opcoes.somPreReady;
                const audio = new Audio(som);
                audio.volume = opcoes.volume / 100;
                document.getElementById('setPlayerReady').addEventListener('click', function (e) {
                    audio.play();
                });
            }
        });
        const somPreReady = criarObserver("#rankedModals", somPreReadyFunc)
    }

    if (opcoes.somReady) {
        const somReadyFunc = mutations => $.each(mutations, (i, mutation) => {
            var addedNodes = $(mutation.addedNodes);
            let selector = '#gameModalReadyBtn > button';
            var readyButton = addedNodes.find(selector).addBack(selector);
            if (readyButton.length && readyButton.text() === "Ready" && !readyButton.disabled) {
                const som = opcoes.somReady === 'custom' ? opcoes.customSomReady : opcoes.somReady;
                const audio = new Audio(som);
                audio.volume = opcoes.volume / 100;
                document.getElementById('gameModalReadyBtn').addEventListener('click', function (e) {
                    audio.play();
                });
            }
        });
        const somReady = criarObserver("#rankedModals", somReadyFunc)
    }

    if (opcoes.autoAceitarPreReady) {
        const autoAceitarPreReadyFunc = mutations => $.each(mutations, (i, mutation) => {
            var addedNodes = $(mutation.addedNodes);
            let selector = '#setPlayerReady';
            var preReadyButton = addedNodes.find(selector).addBack(selector);
            if (preReadyButton.length) {
                setTimeout(function() {preReadyButton[0].click();}, 500)
            }
        });
        const autoAceitarPreReady = criarObserver('#rankedModals', autoAceitarPreReadyFunc);
    }

    if (opcoes.autoAceitarReady) {
        const autoAceitarReadyFunc = mutations => $.each(mutations, (i, mutation) => {
            var addedNodes = $(mutation.addedNodes);
            let selector = '#gameModalReadyBtn > button';
            var readyButton = addedNodes.find(selector).addBack(selector);
            if (readyButton.length && readyButton.text() === "Ready" && !readyButton.disabled) {
                setTimeout(function() {readyButton[0].click();}, 500)
            }
        });
        const autoAceitarReady = criarObserver("#rankedModals", autoAceitarReadyFunc);
    }

    if (opcoes.autoFixarMenuLobby) {
        let freeuser = document.getElementsByClassName("SettingsMenu SettingsMenu--free");
        const autoFixarMenuLobbyFunc = mutations => mutations.forEach((mutation) => {
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
                        } else {
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
                        } else {
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
        const autoFixarMenuLobby = criarObserver("#lobbyContent", autoFixarMenuLobbyFunc);
    }

    if (opcoes.autoConcordarTermosRanked) {
        const autoConcordarTermosRankedFunc = mutations => $.each(mutations, (i, mutation) => {
            const addedNodes = $(mutation.addedNodes);
            let selector = '.ranked-modal-agree.container-fluid > a';
            const concordarButton = addedNodes.find(selector).addBack(selector);
            if (concordarButton.length) {
                concordarButton[0].click();
            }
        });
        const autoConcordarTermosRanked = criarObserver('#rankedModals', autoConcordarTermosRankedFunc);
    }

    if (opcoes.webhookLink.length !== 0) {
        const partidaInfoFunc = mutations => $.each(mutations, async (i, mutation) => {
            var addedNodes = $(mutation.addedNodes);
            let selector = '#gameModalCopyServer';
            var ipInput = addedNodes.find(selector).addBack(selector);
            if (ipInput.length) {
                const IPSelector = "game-modal-command-input"
                const campoIP = document.getElementsByClassName(IPSelector)
                console.log(campoIP)
                if (campoIP[0].value) {
                    const listenGame = await axios.get("https://gamersclub.com.br/lobbyBeta/openGame")
                    if (listenGame.data.game.live) {
                        if (document.getElementById("botaoDiscordnoDOM")) {
                            return false;
                        } else {
                            $(".game-modal-play-command.half-size.clearfix").parent().append('<button id="botaoDiscordnoDOM" class="game-modal-command-btn" data-tip-text="Clique para enviar no discord">Enviar no Discord</button>');
                            document.getElementById("botaoDiscordnoDOM").addEventListener('click', async function (e) {
                                await enviarDadosPartida(opcoes.webhookLink, listenGame.data);
                            })
                            if (opcoes.enviarPartida) {
                                await enviarDadosPartida(opcoes.webhookLink, listenGame.data);
                            }
                        }
                    }
                }
            }
        });
        const lobbyLinkFunc = mutations => mutations.forEach(async (mutation) => {
            if (!mutation.addedNodes) return;
            for (let i = 0; i < mutation.addedNodes.length; i++) {
                let node = mutation.addedNodes[i];
                if (node.nextElementSibling && node.nextElementSibling.className && node.nextElementSibling.className.includes('sidebar-desafios sidebar-content')) {
                    if (opcoes.webhookLink.startsWith("http")) {
                        if (document.getElementById("discordLobbyButton")) {
                            return false;
                        } else {
                            if (opcoes.enviarLinkLobby) {
                                const lobbyInfo = await axios.post("/lobbyBeta/openRoom");
                                await lobbySender(opcoes.webhookLink, lobbyInfo.data)
                                location.href = `javascript:successAlert("[Discord] - Enviado com sucesso"); void 0`;
                            }
                            document.getElementsByClassName("sidebar-titulo sidebar-sala-titulo")[0].setAttribute("style", "font-size: 12px;")
                            $(".btn-radial.btn-blue.btn-copiar-link").parent().append('<span class="btn-radial btn-blue btn-copiar-link" id="discordLobbyButton" title="Enviar lobby Discord" data-jsaction="gcCommonTooltip" data-tip-text="Convidar Amigos"><img src="https://img.icons8.com/material-sharp/18/ffffff/discord-logo.png"/></span>');

                            document.getElementById('discordLobbyButton').addEventListener('click', async function () {
                                const lobbyInfo = await axios.post("/lobbyBeta/openRoom");
                                await lobbySender(opcoes.webhookLink, lobbyInfo.data)
                                location.href = `javascript:successAlert("[Discord] - Enviado com sucesso"); void 0`;
                            });

                            const selectorDeleteLobby = "lobbyAdmin-btnExcluir"
                            if (document.getElementById(selectorDeleteLobby)) {
                                document.getElementById(selectorDeleteLobby).removeAttribute("onclick")
                                document.getElementById(selectorDeleteLobby).addEventListener("click", async function () {
                                    location.href = "javascript:lobby.removeRoom(); void 0"
                                    adicionarBotaoForcarCriarLobby()
                                })
                            }
                        }
                    }
                }
            }
        });
        const partidaInfo = criarObserver("#rankedModals", partidaInfoFunc);
        const lobbyLink = criarObserver("#lobbyContent", lobbyLinkFunc);
    }

    //Feature pra criar lobby caso full
    adicionarBotaoForcarCriarLobby();
};

const criarObserver = (seletor, exec) => {
    let observer = new MutationObserver((mutations) => {
        exec(mutations);
    });

    observer.observe($(seletor).get(0), {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false,
    });
}

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
                chrome.storage.sync.get(["preVetos", 'lobbyPrivada'], async res => {
                    const preVetos = res.preVetos ? res.preVetos : [];
                    const lobbyPrivada = res.lobbyPrivada ? res.lobbyPrivada : false
                    const postData = {
                        "max_level_to_join": 20,
                        "min_level_to_join": 0,
                        "private": lobbyPrivada,
                        "region": 0,
                        "restriction": 1,
                        "team": null,
                        "team_players": [],
                        "type": "newRoom",
                        "vetoes": preVetos
                    }
                    const criarPost = await axios.post("/lobbyBeta/createLobby", postData);
                    if (criarPost.data.success) {
                        const loadLobby = await axios.post("/lobbyBeta/openRoom");
                        if (loadLobby.data.success) {
                            lobbyCriada = true;
                            location.href = "javascript:openLobby(); void 0";
                            setTimeout(async () => {
                                //Lobby criada com sucesso e entrado na janela da lobby já
                                lobbyCriada = true;
                                adicionarBotaoForcarCriarLobby();
                                clearInterval(intervalCriarLobby);
                                adicionarBotaoForcarCriarLobby();
                            }, 1000);
                        }
                    } else {
                        if (criarPost.data.message.includes("Anti-cheat")) {
                            clearInterval(intervalCriarLobby);
                            adicionarBotaoForcarCriarLobby();
                            location.href = `javascript:errorAlert('${criarPost.data.message}'); void 0`;
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