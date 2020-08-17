let page = document.getElementById('p-auto-aceitar');
function constructOptions() {
    // let checkboxPreReady = document.getElementById('auto-aceitar-pre-ready');

    let checkboxMedalhas = document.getElementById('auto-esconder-medalhas');
    
    let checkboxConquistas = document.getElementById('auto-esconder-conquistas');
    
    chrome.storage.sync.get(['autoEsconderMedalhas', 'autoEsconderConquistas'], function(result) {
        if (result.autoEsconderMedalhas) {
            checkboxMedalhas.checked = true
        }
        if (result.autoEsconderConquistas) {
            checkboxConquistas.checked = true
        }
    });

    checkboxConquistas.addEventListener('change', function(e) {
        chrome.storage.sync.set({autoEsconderConquistas: this.checked}, function() {});
    });

    checkboxMedalhas.addEventListener('change', function(e) {
        chrome.storage.sync.set({autoEsconderMedalhas: this.checked}, function() {});
    });

    // checkboxPreReady.addEventListener('change', function(e) {
    //     chrome.storage.sync.set({autoAceitarPreReady: this.checked}, function() {});
    // });
}
constructOptions();