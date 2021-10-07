let title = null;
let kdr = null;

export const mostrarKdr = mutations => {
  $.each( mutations, async ( _, mutation ) => {
    $( mutation.addedNodes )
      .find( 'div.sala-lineup-player' ).addBack( 'div.sala-lineup-player' )
      .each( ( _, element ) => {
        $ ( 'div.sala-lineup-player' ).css( 'min-height', '190px' );
        if ( $( element ).find( 'div.player-placeholder' ).addBack( 'div.player-placeholder' ).length > 0 ) {
          $( element ).find( 'div.sala-lineup-placeholder' ).css( 'height', '100px' );
          $ ( element ).find( 'div.sala-lineup-imagem' ).css( 'margin-top', '23px' );
        } else {
          title = $( element ).find( 'div.sala-lineup-imagem > div > a' ).attr( 'title' );
          if ( $( element ).find( '#gcbooster_kdr' ).length === 0 ) {
            kdr = getKdrFromTitle( title );
            $( element )
              .prepend( $( '<div/>',
                {
                  'id': 'gcbooster_kdr',
                  'css': {
                    'width': '45px',
                    'height': '20px',
                    'display': 'flex',
                    'align-items': 'center',
                    'color': 'white',
                    'font-weight': 'bold',
                    'background-color': 'rgba(0, 0, 0, 0.4)'
                  }
                } )
                .append( $( '<span/>', { 'id': 'gcbooster_kdr_span', 'text': kdr, 'css': { 'width': '100%', 'font-size': '10px' } } ) ) );
            $( element ).find( 'div.sala-lineup-player' ).append( '<style>.sala-lineup-player:before{top:15px !important;}</style>' );
          }
        }
      } );
  } );
};

function getKdrFromTitle( title ) {
  const regexp = /KDR:\s+(\d+\.\d+)\s/g;
  return Array.from( title.matchAll( regexp ), m => m[1] )[0];
}
