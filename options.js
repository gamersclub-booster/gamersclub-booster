function constructOptions() {
    let checkboxPreReady = document.getElementById('auto-aceitar-pre-ready');
    
    let checkboxCopiarIp = document.getElementById('auto-copiar-ip');

    let checkboxMedalhas = document.getElementById('auto-esconder-medalhas');
    
    let checkboxConquistas = document.getElementById('auto-esconder-conquistas');
    
    chrome.storage.sync.get(['autoEsconderMedalhas', 'autoEsconderConquistas', 'autoAceitarPreReady', 'autoCopiarIp'], function(result) {
        console.log(result);
        checkboxMedalhas.checked = result.autoEsconderMedalhas;
        checkboxConquistas.checked = result.autoEsconderConquistas;
        checkboxPreReady.checked = result.autoAceitarPreReady;
        checkboxCopiarIp.checked = result.autoCopiarIp;
    });

    checkboxConquistas.addEventListener('change', function(e) {
        chrome.storage.sync.set({autoEsconderConquistas: this.checked}, function() {});
    });

    checkboxMedalhas.addEventListener('change', function(e) {
        chrome.storage.sync.set({autoEsconderMedalhas: this.checked}, function() {});
    });

    checkboxPreReady.addEventListener('change', function(e) {
        chrome.storage.sync.set({autoAceitarPreReady: this.checked}, function() {});
    });

    checkboxCopiarIp.addEventListener('change', function(e) {
        chrome.storage.sync.set({autoCopiarIp: this.checked}, function() {});
    });
}
constructOptions();