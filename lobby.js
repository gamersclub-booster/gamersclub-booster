const log = ( msg ) => console.log('[GC Booster] ',  msg );
let options = {};
chrome.storage.sync.get(['autoAceitarPreReady', 'autoCopiarIp'], function (result) {
    options = result;
    init();
});

const init = () => {
    if ( options.autoAceitarPreReady ) {
        const intervalAceitar = setInterval(function() {
            const buttonAceitar = document.getElementById('playNowOverlayReady');
            if (buttonAceitar && buttonAceitar.textContent === 'Ready') {
                buttonAceitar.click();
            }
        }, 5000);
    }
    if ( options.autoCopiarIp ) {
        const intervalCopia = setInterval(function() {
            const buttonCopia = document.getElementById('gameModalCopyServer');
            if (buttonCopia && buttonCopia.textContent === 'Copiar IP') {
                buttonCopia.click();
            }
        }, 5000);
    }
};
