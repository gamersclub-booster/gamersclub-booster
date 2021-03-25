let opcoes = {};
chrome.storage.sync.get(
    ['autoAceitarPreReady', 'autoCopiarIp', 'autoAceitarReady', 'autoConcordarTermosRanked', 'autoFixarMenuLobby'],
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
                if (readyButton.length) {
                    readyButton[0].click();
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
    	
    $( "#lobby-create-denied-wrapper" ).remove();
    $( ".overlay" ).remove();
    document.getElementById('forcarCriacaoLobbyBtn').addEventListener('click', function () {
        lobbyCriada = false;
        intervalCriarLobby = intervalerCriacaoLobby();
        adicionarBotaoCancelarCriarLobby();
    });
}
//Criar lobby: https://github.com/LouisRiverstone/gamersclub-lobby_waiter/ com as modificações por causa do layout novo
function intervalerCriacaoLobby() {
    return setInterval(() => {
        if (!lobbyCriada || $('.sidebar-titulo.sidebar-sala-titulo').text().length) {
            const lobbies = $('span.Tag__tagLabel.Tag__tagLabel--success').text().split('/');
            //50 free 400 premium
            const limiteLobby = $('.Cta.Topbar').text() ? 50 : 400;
            if (lobbies[1] < limiteLobby) {
                $('button.WasdButton.WasdButton--success.WasdButton--lg.LobbyHeaderButton').click();

                const alertaAc = $(
                    ".noty_bar.noty_type__info.noty_theme__mint.noty_close_with_click.noty_has_timeout.noty_close_with_button:contains('Você precisa estar com o jogo')"
                );
                if (alertaAc.length) {
                    clearInterval(intervalCriarLobby);
                    adicionarBotaoForcarCriarLobby();
                    return;
                }

                const botaoCriarSala = $(
                    '.WasdButton.WasdButton--success.WasdButton--lg.CreateLobbyModalFooterButton.CreateLobbyModalFooterButton--create'
                );
                if (botaoCriarSala && botaoCriarSala.text() === 'Criar Sala' || botaoCriarSala && botaoCriarSala.text() === 'Create Room') {
                    //TODO: Adicionar opções de pre veto

                    //Espera criar o modal... Verificar depois disso se criou mesmo, mas pra isso preciso testar em uma conta free quando tiver lotado....
                    setTimeout(() => {
                        $('.CheckboxContainer__input').click();
                        botaoCriarSala.click();
                        const alertaLimite = $(
                            ".noty_bar.noty_type__info.noty_theme__mint.noty_close_with_click.noty_has_timeout.noty_close_with_button:contains('lobbies_limit_reached×')"
                        );
                        if (alertaLimite.length) {
                            return;
                        }
                        lobbyCriada = true;
                        adicionarBotaoForcarCriarLobby();
                        clearInterval(intervalCriarLobby);
                    }, 500);
                }
            }
        } else {
            adicionarBotaoForcarCriarLobby();
            clearInterval(intervalCriarLobby);
        }
    }, 500);
}
