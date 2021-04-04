const features = [
    'autoAceitarPreReady',
    'autoCopiarIp',
    'autoAceitarReady',
    'autoFixarMenuLobby',
    'autoConcordarTermosRanked',
    'mostrarLevelProgress'
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
const paginas = ['geral', 'mapas', 'lobby', 'contato', 'sobre'];

const versao = "1.0.20"

function iniciarPaginaOpcoes() {
    adicionaVersao();
    marcarCheckboxes();
    marcarPreVetos();
    adicionarListenersFeatures();
    adicionarListenersPaginas();
    adicionarListenerPreVetos();
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
            console.log(feature, 'changed');
            chrome.storage.sync.set({
                [feature]: this.checked
            }, function () {});
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
