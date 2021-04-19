const ocultarMissoesAddButton = () => {
  $( 'ul.WasdTabs.WasdTabs__navigationBar.WasdTabs--noContent' ).append( `
        <li>
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
        </li>
        <li>
            <Button 
                id="expandirMissoesBtn" 
                style="
                    text-transform: capitalize; 
                    border: 1px solid #FFFFFF;
                    margin-left: 25px;
                    font-size: 12px;
                    padding: 2px 4px 2px 4px;;
                "
            >
                Expandir Progressos
            </Button>
        </li>
    ` );

  document.getElementById( 'ocultarMissoesBtn' ).addEventListener( 'click', function () {
    $( 'button:contains("Ver desafios") > svg:not(.MissionsCardBox__actionsIcon--expanded)' ).parent().click();
  } );
  document.getElementById( 'expandirMissoesBtn' ).addEventListener( 'click', function () {
    $( 'button:contains("Ver desafios") > svg.MissionsCardBox__actionsIcon--expanded' ).parent().click();
  } );
};

ocultarMissoesAddButton();
