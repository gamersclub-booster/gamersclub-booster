export function addLobbyFeatures() {
  $( '<div/>', { 'css': { 'padding': '0px 16px 16px' } } )
    .append( $( '<div/>', { 'id': 'gcbooster_lobby_features' } ) )
    // .append( $( '<div/>', { 'id': 'gcbooster_info', 'css': { 'display': 'none' } } ) )
    .insertAfter( $( '#lobby-filters-container > div:nth-child(2)' ) );

  $( '#gcbooster_lobby_features' )
    .append( $( '<p/>', { 'text': 'GamersClub Booster', 'css': { 'color': 'orange', 'align-self': 'center' } } ) )
    .append( $( '<div/>', { 'css': { 'display': 'flex', 'flex-direction': 'row' } } ).addClass( 'options-body' )
      .append( $( '<div/>' ).addClass( 'options-section' )
        .append( $( '<p/>', { 'text': 'Ações', 'css': { 'color': 'orange' } } ) )
        .append( $( '<div/>', { 'id': 'gcbooster_botoes' } ) ) )
      .append( $( '<div/>' ).addClass( 'options-section' )
        .append( $( '<div/>', { 'id': 'gcbooster_kdr_filter' } ) ) ) );
}
