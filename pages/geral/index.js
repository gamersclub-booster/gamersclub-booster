const log = (msg) => console.log('[GC Booster] ', msg);

let generalOptions = [];
chrome.storage.sync.get(null, function (result) {
    generalOptions = result;
    initGcBooster();
});

const initGcBooster = async () => {
    if (generalOptions.autoEsconderChat) {
        $('.gcf-sidebar').first().hide();
    }
};