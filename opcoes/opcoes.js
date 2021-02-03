function constructOptions() {
    let checkboxPreReady = document.getElementById('auto-aceitar-pre-ready');

    let checkboxCopiarIp = document.getElementById('auto-copiar-ip');

    let checkboxReady = document.getElementById('auto-aceitar-ready');

    let checkboxFixarMenuLobby = document.getElementById('auto-fixar-menu-lobby');

    let checkboxEsconderBotaoSuporte = document.getElementById('auto-esconder-botao-suporte');

    chrome.storage.sync.get(null, function (result) {
        checkboxPreReady.checked = result.autoAceitarPreReady;
        checkboxCopiarIp.checked = result.autoCopiarIp;
        checkboxReady.checked = result.autoAceitarReady;
        checkboxFixarMenuLobby.checked = result.autoFixarMenuLobby;
        checkboxEsconderBotaoSuporte.checked = result.autoEsconderBotaoSuporte;
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

    checkboxEsconderBotaoSuporte.addEventListener('change', function (e) {
        chrome.storage.sync.set({ autoEsconderBotaoSuporte: this.checked }, function () { });
    });
}
constructOptions();