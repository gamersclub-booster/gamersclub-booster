export function addCabecalho() {
  $( '<div/>', { 'class': 'FilterLobby_container__fB29J', 'css': { 'margin-top': '10px' } } )
    .append( $( '<div/>', { 'class': 'FilterLobby_main__23Z64', 'id': 'gcbooster_cabecalho', 'css': { 'width': '1010.39px' } } ) )
    .append( $( '<div/>', { 'class': 'FilterLobby_main__23Z64', 'id': 'gcbooster_info', 'css': { 'display': 'none' } } ) )
    .insertAfter( $( '#lobbyContent > div.row.lobby-rooms-content > div > div' ) );

  $( '#gcbooster_cabecalho' ).append( $( '<div/>', { 'class': 'FilterLobby_section__3UmYp' } )
    .append( $( '<p/>', { 'class': 'FilterLobby_sectionLabel__1zPew', 'text': 'GamersClub Booster', 'css': { 'color': 'orange' } } ) )
    .append( $( '<div/>', { 'class': 'FilterLobby_buttons__2ySGq', 'id': 'gcbooster_botoes' } ) ) );
}
