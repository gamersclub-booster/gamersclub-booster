const log = ( msg ) => console.log('[GC Booster] ',  msg );
let options = {};
chrome.storage.sync.get(['autoAceitarPreReady'], function (result) {
    options = result;
    init();
});

const init = () => {
    if ( options.autoAceitarPreReady ) {
        const interval = setInterval(function() {
            const button = document.getElementById('playNowOverlayReady');
            if (button) {
                button.click();
            }
        }, 5000);
    }
};
