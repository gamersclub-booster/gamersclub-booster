function constructOptions() {
    let checkboxPreReady = document.getElementById('auto-aceitar-pre-ready');

    let checkboxCopiarIp = document.getElementById('auto-copiar-ip');

    let checkboxMedalhas = document.getElementById('auto-esconder-medalhas');

    let checkboxConquistas = document.getElementById('auto-esconder-conquistas');

    let checkboxReady = document.getElementById('auto-aceitar-ready');

    let checkboxFixarMenuLobby = document.getElementById('auto-fixar-menu-lobby');

    chrome.storage.sync.get(null, function (result) {
        checkboxMedalhas.checked = result.autoEsconderMedalhas;
        checkboxConquistas.checked = result.autoEsconderConquistas;
        checkboxPreReady.checked = result.autoAceitarPreReady;
        checkboxCopiarIp.checked = result.autoCopiarIp;
        checkboxReady.checked = result.autoAceitarReady;
        checkboxFixarMenuLobby.checked = result.autoFixarMenuLobby;
    });

    checkboxConquistas.addEventListener('change', function (e) {
        chrome.storage.sync.set({ autoEsconderConquistas: this.checked }, function () { });
    });

    checkboxMedalhas.addEventListener('change', function (e) {
        chrome.storage.sync.set({ autoEsconderMedalhas: this.checked }, function () { });
    });

    checkboxPreReady.addEventListener('change', function (e) {
        chrome.storage.sync.set({ autoAceitarPreReady: this.checked }, function () { });
    });

    checkboxCopiarIp.addEventListener('change', function (e) {
        chrome.storage.sync.set({ autoCopiarIp: this.checked }, function () { });
    });

    checkboxReady.addEventListener('change', function (e) {
        chrome.storage.sync.set({ autoAceitarReady: this.checked }, function () { });
    });

    checkboxFixarMenuLobby.addEventListener('change', function (e) {
        chrome.storage.sync.set({ autoFixarMenuLobby: this.checked }, function () { });
        chrome.tabs.getSelected(null, function (tab) {
            var code = 'window.location.reload();';
            chrome.tabs.executeScript(tab.id, { code: code });
        });
    });
}
constructOptions();