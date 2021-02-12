
let options = {};
chrome.storage.sync.get(['ocultarMissoes'], function (result) {
    opcoes = result;
    ocultarMissoesAddButton();
});

const ocultarMissoesAddButton = () => {
    $('.Missions__warnTwoMissions')
    .append(`
        <div>
            <Button 
                id="ocultarMissoesBtn" 
                style="
                    text-transform: capitalize; 
                    border: 1px solid #FFFFFF;
                    margin-left: 25px;
                    font-size: 12px;
                    padding: 2px 4px 2px 4px;;
                "
            >
                Ocultar progressos
            </Button>
        </div>
    `);

    document.getElementById("ocultarMissoesBtn").addEventListener("click", function(){
        ocultarMissoes();
    });
}


function ocultarMissoes()  {
    if ($('button:contains("Ver desafios") > svg:not(.MissionsCardBox__actionsIcon--expanded)')) {
        $('button:contains("Ver desafios") > svg:not(.MissionsCardBox__actionsIcon--expanded)').parent().click();
    } else {
        $('button:contains("Ver desafios") > svg:contains(.MissionsCardBox__actionsIcon--expanded)').parent().click();
    }

}
