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
        value: 3,
        class: 'filterKdr'
      } ) ).css( {
        'height': '32px',
        'align-items': 'center'
      } );
    $( '#filtrarKdr' ).append( '<span id="filtrarKdrValor" class="FilterLobby_skillLevelTag__10iAp">3+</span>' );
  }

  filtrarLobbiesKdr();
};



const filtrarLobbiesKdr = () => {
  setInterval( () => {
    const filtroValue = $( '#filtrarKdrInput' )?.value;
    $( '#filtrarKdrValor' )[0].textContent = filtroValue > 2.99 ? '3+' : filtroValue;
    $( 'span[gcbooster_kdr_lobby]' ).each( function ( _i, elem ) {
      const lobbyId = $( elem ).attr( 'gcbooster_kdr_lobby' );
      if ( !lobbyId ) { return; }
      const kdrs = [];
      $( `span[gcbooster_kdr_lobby=${lobbyId}]` ).each( function ( _i, elem ) {
        kdrs.push( $( elem ).text() );
      } );
      if ( filtroValue <= 2.99 && kdrs.find( v => v > filtroValue ) ) {
        $( `#${lobbyId}` ).css( 'display', 'none' );
      } else {
        $( `#${lobbyId}` ).css( 'display', 'flex' );
      }
    } );
  }, 100 );
};

export { adicionarFiltroKdr };

