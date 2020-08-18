function constructOptions() {
    let checkboxPreReady = document.getElementById('auto-aceitar-pre-ready');

    let checkboxMedalhas = document.getElementById('auto-esconder-medalhas');
    
    let checkboxConquistas = document.getElementById('auto-esconder-conquistas');
    
    chrome.storage.sync.get(['autoEsconderMedalhas', 'autoEsconderConquistas', 'autoAceitarPreReady'], function(result) {
        console.log(result);
        checkboxMedalhas.checked = result.autoEsconderMedalhas;
        checkboxConquistas.checked = result.autoEsconderConquistas;
        checkboxPreReady.checked = result.autoAceitarPreReady;
    });

    checkboxConquistas.addEventListener('change', function(e) {
        chrome.storage.sync.set({autoEsconderConquistas: this.checked}, function() {});
    });

    checkboxMedalhas.addEventListener('change', function(e) {
        chrome.storage.sync.set({autoEsconderMedalhas: this.checked}, function() {});
    });

    checkboxPreReady.addEventListener('change', function(e) {
        console.log(this.checked);
        chrome.storage.sync.set({autoAceitarPreReady: this.checked}, function() {});
    });
}
constructOptions();