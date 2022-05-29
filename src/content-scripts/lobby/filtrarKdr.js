const styleKdr =
'input[type="range"] {' +
'  margin: auto 8px auto 0;' +
'  -webkit-appearance: none;' +
'  position: relative;' +
'  overflow: hidden;' +
'  height: 12px;' +
'  cursor: pointer;' +
'  background: transparent;' +
'  border-radius: 15px;' +
'}' +
'::-webkit-slider-runnable-track {' +
'  background: #383b51;' +
'}' +
'::-webkit-slider-thumb {' +
'  -webkit-appearance: none;' +
'  width: 12px; /* 1 */' +
'  height: 12px;' +
'  background: #fff;' +
'  box-shadow: -200px 0 0 195px #2196fd;' +
'  border: 3px solid #fff;' +
'  border-radius: 50%;' +
'  border-radius: 15px;' +
'}' +
'::-moz-range-track {' +
'  height: 12px;' +
'  background: #ddd;' +
'}' +
'::-moz-range-thumb {' +
'  -webkit-appearance: none;' +
'  width: 12px; /* 1 */' +
'  height: 12px;' +
'  background: #fff;' +
'  box-shadow: -200px 0 0 195px #2196fd;' +
'  border: 3px solid #fff; /* 1 */' +
'  border-radius: 50%;' +
'  border-radius: 15px;' +
'}' +
'::-ms-fill-lower {' +
'  background: #2196fd;' +
'}' +
'::-ms-thumb {' +
'  -webkit-appearance: none;' +
'  width: 12px; /* 1 */' +
'  height: 12px;' +
'  background: #fff;' +
'  box-shadow: -200px 0 0 195px #2196fd;' +
'  border: 3px solid #fff; /* 1 */' +
'  border-radius: 50%;' +
'  border-radius: 15px;' +
'}' +
'::-ms-ticks-after {' +
'  display: none;' +
'}' +
'::-ms-ticks-before {' +
'  display: none;' +
'}' +
'::-ms-track {' +
'  background: #ddd;' +
'  color: transparent;' +
'  height: 12px;' +
'  border: none;' +
'}' +
'::-ms-tooltip {' +
'  display: none;' +
'}'
;

const adicionarFiltroKdr = () => {
  if ( !$( '#filtrarKdrInput' ).length ) {
    $( '#gcbooster_cabecalho' ).append( $( '<div/>', { 'id': 'gcbooster_section2', 'class': 'FilterLobby_section__3UmYp' } )
      .append( $( '<p/>', { 'class': 'FilterLobby_sectionLabel__1zPew', 'text': 'Filtrar por KDR', 'css': { 'color': 'orange' } } ) )
      .append( $( '<div/>', { 'class': 'FilterLobby_buttons__2ySGq', 'id': 'filtrarKdr' } ) ) );
    $( '#filtrarKdr' )
      .append( $( '<input/>', {
        id: 'filtrarKdrInput',
        type: 'range',
        min: '0.1',
        max: '3',
        step: '0.1',
        value: 3
      } ).addClass( 'filtrarKdr' ) )
      .append( `<style>${styleKdr}</style>` );
    $( '#filtrarKdr' ).append( '<span id="filtrarKdrValor" class="FilterLobby_skillLevelTag__10iAp">3+</span>' );
  }

  filtrarLobbiesKdr();
};



const filtrarLobbiesKdr = () => {
  setInterval( () => {
    const filtroValue = document.getElementById( 'filtrarKdrInput' )?.value;
    $( '#filtrarKdrValor' )[0].textContent = filtroValue > 2.99 ? '3+' : filtroValue;
    $( 'span[gcbooster_kdr_lobby]' ).each( function ( _i, elem ) {
      const lobbyId = elem.getAttribute( 'gcbooster_kdr_lobby' );
      if ( !lobbyId ) { return; }
      const kdrs = [];
      $( `span[gcbooster_kdr_lobby=${lobbyId}]` ).each( function ( _i, elem ) {
        kdrs.push( elem.textContent );
      } );
      if ( filtroValue <= 2.99 && kdrs.find( v => v > filtroValue ) ) {
        document.getElementById( lobbyId ).style.display = 'none';
      } else {
        document.getElementById( lobbyId ).style.display = 'flex';
      }
    } );
  }, 100 );
};

export { adicionarFiltroKdr };
