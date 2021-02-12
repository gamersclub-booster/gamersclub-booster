let opcoes = {};
chrome.storage.sync.get(['autoAceitarPreReady', 'autoCopiarIp', 'autoAceitarReady', 'autoConcordarTermosRanked', 'autoFixarMenuLobby', 'autoOcultarMissoes'], function (result) {
    opcoes = result;
    initLobby();
});

const ocultarMissoes = async () => {
    if (opcoes.autoOcultarMissoes && !($("svg")[0].hasClass("MissionsCardBox__actionsIcon--expanded"))) {
        $('button:contains("Ver desafios")')[0].click();
    }
}

(async () => {
    $('body').on('DOMNodeInserted', '#GamersClubCSApp-missions', async function () {
        //Wait 5 seconds before start;
        log('Page changed, running.')
        await new Promise(r => setTimeout(r, 3000));
        ocultarMissoes();
    });

    ocultarMissoes();
})();



