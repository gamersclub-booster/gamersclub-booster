let page = document.getElementById('p-auto-aceitar');
function constructOptions() {
    let checkbox = document.getElementById('auto-aceitar-pre-ready');
    checkbox.addEventListener('change', function(e) {
        console.log(this.checked);
        chrome.storage.sync.set({autoAceitarPreReady: this.checked}, function() {});
    });
}
constructOptions();