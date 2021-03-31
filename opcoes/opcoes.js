const features = [
    'autoAceitarPreReady',
    'autoCopiarIp',
    'autoAceitarReady',
    'autoFixarMenuLobby',
    'autoConcordarTermosRanked',
    'mostrarLevelProgress',
    'autoVeto'
];

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
const paginas = ['geral', 'mapas', 'lobby', 'contato', 'sobre', 'sons'];

const audios = {
    "undefined": "Nenhum",
    "https://www.myinstants.com/media/sounds/esl-pro-league-season-11-north-america-mibr-vs-furia-mapa-iii-mirage-mp3cut.mp3": "Começou - Gaules",
    "https://www.myinstants.com/media/sounds/wakeup_1QLWl1G.mp3": "Wake Up - TeamSpeak",
    "https://www.myinstants.com/media/sounds/onarollbrag13.mp3": "Easy Peasy - CS:GO",
    "https://www.myinstants.com/media/sounds/que-ota_-17.mp3": "Qué Ota? - LUCAS1",
    "https://www.myinstants.com/media/sounds/tuturu_1.mp3": "Tuturu - Steins;Gate",
    "custom": "Customizar",
}

const versao = "1.0.21"

const mapas = ['de_dust2', 'de_nuke', 'de_train', 'de_mirage', 'de_overpass', 'de_inferno', 'de_vertigo', 'de_cbble_classic'];

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
    adicionaListaDeMapas();
}
function adicionaListaDeMapas() {
    chrome.storage.sync.get(null, (response) => {
        console.log(response);
        listaMaps = response.mapas || mapas;
        for (const mapa of listaMaps) {
            var node = document.createElement("li");
            var textnode = document.createTextNode(mapa);
            node.appendChild(textnode);
            node.id = mapa;
            node.class = 'drag-box';
            document.getElementById('drag-container').appendChild(node);
        }
        dragonfly('.drag-container', function () {
            const mapList = [ ...document.getElementById('drag-container').childNodes];
            const mapasSalvar = mapList.map(m => m.id);
            chrome.storage.sync.set({ ['mapas']: mapasSalvar }, function () {});
        });

    });
   
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
        console.log({response});
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

iniciarPaginaOpcoes();
