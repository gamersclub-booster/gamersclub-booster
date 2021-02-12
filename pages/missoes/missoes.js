let opcoes = {};
chrome.storage.sync.get(['autoOcultarMissoes'], function (result) {
    opcoes = result;
    ocultarMissoes();
});

const ocultarMissoes = () => {
    if (opcoes.autoOcultarMissoes) {
        $('button:contains("Ver desafios") > svg:not(.MissionsCardBox__actionsIcon--expanded)').parent().click();
    }
}
