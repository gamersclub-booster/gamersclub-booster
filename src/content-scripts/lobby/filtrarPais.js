const paises = [
  { value: '0', text: 'Todos' },
  { value: 'Brasil', text: 'Brasil' },
  { value: 'Argentina', text: 'Argentina' },
  { value: 'Bolivia', text: 'Bolivia' },
  { value: 'Chile', text: 'Chile' },
  { value: 'Colombia', text: 'Colombia' },
  { value: 'Costa Rica', text: 'Costa Rica' },
  { value: 'Espanha', text: 'Espanha' },
  { value: 'Estados Unidos', text: 'EUA' },
  { value: 'França', text: 'França' },
  { value: 'Suiça', text: 'Suiça' },
  { value: 'Paraguai', text: 'Paraguai' },
  { value: 'Uruguai', text: 'Uruguai' }
];

const adicionarFiltroPais = () => {
  if ( !$( '#filtrarPaisInput' ).length ) {
    $( '#gcbooster_cabecalho' ).append( $( '<div/>', { 'id': 'gcbooster_section2', 'class': 'FilterLobby_section__3UmYp' } )
      .append( $( '<p/>', { 'class': 'FilterLobby_sectionLabel__1zPew', 'text': 'Filtrar País', 'css': { 'color': 'orange' } } ) )
      .append( $( '<div/>', { 'class': 'FilterLobby_buttons__2ySGq', 'id': 'filtrarPais' } ) ) );
    $( '#filtrarPais' )
      .append( $( '<select/>', {
        id: 'filtrarPaisInput',
        value: 'Brasil',
        class: 'filterPais'
      } ) );

    $.each( paises, function ( i, item ) {
      $( '#filtrarPais select' ).append( $( '<option>', {
        value: item.value,
        text: item.text
      } ) );
    } );

  }

  filtrarLobbiesPais();
};

const filtrarLobbiesPais = () => {
  setInterval( () => {
    const pais = $( '#filtrarPais select' ).val();

    if ( pais === '0' ) {
      $( '.sala-card-wrapper' ).css( 'visibility', 'visible' ).css( 'position', 'relative' );
      return;
    }

    $( '.sala-card-wrapper' ).each( function ( ) {
      const selectedLine = $( this );
      const lobbyPais = selectedLine.find( '.sala-card-country' ).attr( 'title' );
      if ( lobbyPais === pais ) {
        selectedLine.css( 'visibility', 'visible' ).css( 'position', 'relative' );
      } else {
        selectedLine.css( 'visibility', 'hidden' ).css( 'position', 'absolute' );
      }
    } );
  }, 50 );
};


export { adicionarFiltroPais };
