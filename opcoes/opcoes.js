const features = [
    'autoAceitarPreReady',
    'autoCopiarIp',
    'autoAceitarReady',
    'autoFixarMenuLobby',
    'autoConcordarTermosRanked'
];
function iniciarPaginaOpcoes() {
    chrome.storage.sync.get(null, (response) => {
        if (!response) return false;
        for (const feature of features) {
            document.getElementById(feature).checked = response[feature];
        }
    });

    adicionarListeners();
}
function adicionarListeners() {
    for (const feature of features) {
        console.log(feature);
        document.getElementById(feature).addEventListener('change', function (e) {
            console.log(feature, 'changed');
            chrome.storage.sync.set({ [feature]: this.checked }, function () {});
        });
    }
}

iniciarPaginaOpcoes();