const features = [
    'autoAceitarPreReady',
    'autoCopiarIp',
    'autoAceitarReady',
    'autoFixarMenuLobby',
    'autoConcordarTermosRanked',
    'mostrarLevelProgress',
    'enviarLinkLobby',
    'enviarPartida',
    'lobbyPrivada'];

const preVetosMapas = [
    { mapa: "de_dust2", codigo: 1 },
    { mapa: "de_nuke", codigo: 2 },
    { mapa: "de_train", codigo: 3},
    { mapa: "de_mirage", codigo: 5},
    { mapa: "de_overpass", codigo: 7},
    { mapa: "de_inferno", codigo: 8 },
    { mapa: "de_vertigo", codigo: 10},
    { mapa: "de_cbble_classic", codigo: 11}
];
const configValues = [
    'somReady',
    'somPreReady',
    'volume',
    'customSomPreReady',
    'customSomReady'
]
const paginas = ['geral', 'mapas', 'lobby', 'contato', 'sobre', 'sons', 'integracoes'];

const audios = {
    "undefined": "Nenhum",
    "https://www.myinstants.com/media/sounds/whatsapp_ptt_2021-04-04_at_21.mp3": "Partida encontrada",
    "https://www.myinstants.com/media/sounds/esl-pro-league-season-11-north-america-mibr-vs-furia-mapa-iii-mirage-mp3cut.mp3": "Começou - Gaules",
    "https://www.myinstants.com/media/sounds/wakeup_1QLWl1G.mp3": "Wake Up - TeamSpeak",
    "https://www.myinstants.com/media/sounds/onarollbrag13.mp3": "Easy Peasy - CS:GO",
    "https://www.myinstants.com/media/sounds/que-ota_-17.mp3": "Qué Ota? - LUCAS1",
    "https://www.myinstants.com/media/sounds/tuturu_1.mp3": "Tuturu - Steins;Gate",
    "custom": "Customizar",
}

const versao = "1.0.22"

function iniciarPaginaOpcoes() {
    adicionaVersao();
    marcarCheckboxes();
    marcarPreVetos();
    adicionarListenersFeatures();
    adicionarListenersPaginas();
    adicionarListenerPreVetos();
    popularAudioOptions();
    selecionarSons();
    adicionarListenersSons();
    //alterarLinkWebhook();
    loadWebhook();
}
function popularAudioOptions() {
    for (selectId of ['somPreReady', 'somReady']) {
        var select = document.getElementById(selectId);
        for(index in audios) {
            select.options[select.options.length] = new Option(audios[index], index);
        }
    }
}

function adicionaVersao() {
    Array.from(document.getElementsByClassName('versao')).forEach((v) => {
        v.textContent = versao;
    })
}

function marcarPreVetos() {
    chrome.storage.sync.get(["preVetos"], (response) => {
        if (!response.preVetos) return false;
        for (var i = 0; i < response.preVetos.length; i++) {
            const codigo = response.preVetos[i];
            const mapaNome = preVetosMapas.filter(e => {return e.codigo === codigo})[0].mapa;
            document.getElementById("preVeto" + mapaNome).checked = true;
        }
    });
}

function marcarCheckboxes() {
    chrome.storage.sync.get(null, (response) => {
        if (!response) return false;
        for (const feature of features) {
            document.getElementById(feature).checked = response[feature];
        }
    });
}

function adicionarListenerPreVetos() {
    for (const mapa of preVetosMapas) {
        const idSelector = "preVeto" + mapa.mapa;

        document.getElementById(idSelector).addEventListener('change', function (e) {
            const codigo = document.getElementById(idSelector).getAttribute("codigo");
            chrome.storage.sync.get(["preVetos"], res => {
                const preVetos = res.preVetos;
                if (this.checked) {
                    //adicionar
                    if (preVetos === undefined) {
                        //Primeira vez add um pre veto
                        chrome.storage.sync.set({"preVetos": [Number(codigo)]});
                    } else if (preVetos.length > 2) {
                        //Ja possui 3 pre vetos
                        document.getElementById("prevetoTitle").innerText = "Erro! Máximo 3 mapas";
                        setTimeout(function () {document.getElementById("prevetoTitle").innerText = "Pré Vetos (3 escolhas)"}, 2 * 1000);
                        document.getElementById(idSelector).checked = false;
                        return false;
                    } else if (preVetos.length <= 2) {
                        //Menor ou igual a 2 vetos = adicionar
                        chrome.storage.sync.get(["preVetos"], res => {
                            const preVetosAntes = res.preVetos;
                            preVetosAntes.push(Number(codigo));
                            chrome.storage.sync.set({"preVetos": preVetosAntes});
                        })
                    }
                } else {
                    //desmarquei
                    const preVetosAntes = preVetos;
                    const preVetosDepois = arrayRemove(preVetosAntes, Number(codigo));
                    chrome.storage.sync.set({"preVetos": preVetosDepois});
                    function arrayRemove(arr, value) { 
                        return arr.filter(function(ele){ 
                            return ele != value; 
                        });
                    }
                }
            })
        });
    }
}

function adicionarListenersFeatures() {
    for (const feature of features) {
        document.getElementById(feature).addEventListener('change', function (e) {
            console.log(feature, " changed")
            chrome.storage.sync.set({ [feature]: this.checked }, function () {});
        });
    }
}

function adicionarListenersPaginas() {
    for (const pagina of paginas) {
        document.getElementById(`link-${pagina}`).addEventListener('click', function (e) {
            abrirPagina(pagina);
        });
    }
}

function selecionarSons() {
    chrome.storage.sync.get(null, (response) => {
        if (!response) return false;
        for (const config of configValues) {
            document.getElementById(config).value = response[config];
        }
    });
}

function adicionarListenersSons() {
    for (const config of configValues) {
        document.getElementById(config).addEventListener('change', function (e) {
            if (this.value == "custom") {
                const customObj = document.getElementById(`p-custom${this.id[0].toUpperCase()}${this.id.slice(1)}`)
                if (customObj) customObj.style.display = "block";
            } else {
                const customObj = document.getElementById(`p-custom${this.id[0].toUpperCase()}${this.id.slice(1)}`)
                if (customObj) customObj.style.display = "none";
            }
            chrome.storage.sync.set({ [config]: this.value }, function () {});
        });
    }
    document.getElementById('testarSomPreReady').addEventListener('click', function (e) {
        const som = document.getElementById('somPreReady').value === 'custom' ? document.getElementById('customSomPreReady').value : document.getElementById('somPreReady').value;
        const audio = new Audio(som)
        audio.volume = document.getElementById('volume').value/100;
        audio.play();
    });
    document.getElementById('testarSomReady').addEventListener('click', function (e) {
        const som = document.getElementById('somReady').value === 'custom' ? document.getElementById('customSomReady').value : document.getElementById('somReady').value;
        const audio = new Audio(som)
        audio.volume = document.getElementById('volume').value/100;
        audio.play();
    });
}

function abrirPagina(pagina) {
    const link = document.getElementById(`link-${pagina}`);
    const paginaAtiva = document.getElementById(pagina);

    Array.from(document.getElementsByClassName('ativo')).forEach((el) => {
        el.classList.remove('ativo');
    });

    Array.from(document.getElementsByClassName('active')).forEach((el) => {
        el.classList.remove('active');
    });

    link.classList.add('active');
    paginaAtiva.classList.add('ativo');
}

//Discord

function loadWebhook() {
    chrome.storage.sync.get(["webhookLink"], function (data) {
        if (data.webhookLink) {
            document.getElementById("campoWebhookLink").value = data.webhookLink
            document.getElementById("statusWebhook").innerText = "OK"
            document.getElementById("divDoDiscord").removeAttribute("hidden")
        } else {
            document.getElementById("campoWebhookLink").value = ""
            document.getElementById("statusWebhook").innerText = "Sem URL salva"
        }
    })
    document.getElementById("testarWebhook").addEventListener("click", async function(e) {
        const url = document.getElementById("campoWebhookLink").value
        if (url.length != 0) {
            try {
                await teste(url)
                document.getElementById("statusWebhook").innerText = "OK! Salvando a URL"
                chrome.storage.sync.set({["statusWebhook"]: "OK", ["webhookLink"]: url}, async function (e) {
                    document.getElementById("statusWebhook").innerText = "OK"
                    document.getElementById("divDoDiscord").setAttribute("hidden", true)
                })
            } catch (e) {
                console.log(e)
                document.getElementById("statusWebhook").innerText = "Erro na URL, tente novamente."
                document.getElementById("divDoDiscord").setAttribute("hidden", true)
                console.log("Erro")
            }
        } else {
            chrome.storage.sync.get(["statusWebhook"], function (e) {
                if (e.statusWebhook) {
                    document.getElementById("statusWebhook").innerText = e.statusWebhook
                } else {
                    document.getElementById("statusWebhook").innerText = "Sem URL salva"
                }
            })
        }
    })
}

iniciarPaginaOpcoes();
