import { getFromStorage, setStorage } from '../../lib/storage';

const BASE_URL = 'https://gamersclub.com.br/player';

const SELETOR_DATA_CRIACAO = '.gc-list-title:contains("Registrado em")';

// @TODO: Criar uma função que limpa o cache a cada X tempo ou a cada request e remove os ids que o TTL já expirou
// const limparCache = () => {
// }

export async function getPlayerInfo( id ) {
  const lupaCache = await getFromStorage( 'lupaCache' ) || {};
  if ( lupaCache?.[id]?.ttl > Date.now() ) {
    return lupaCache[id];
  }

  const promise = new Promise( ( resolve, reject ) => {
    try {
      const url = `${BASE_URL}/${id}`;

      $.get( url, function ( html ) {
        let porcentagemVitoria = 0;

        let totalPartidas = 0;
        let totalVitorias = 0;
        let totalDerrotas = 0;

        const dataCriacao = $( html ).find( SELETOR_DATA_CRIACAO ).next().text();
        $( html ).find( '.gc-card-history-text' ).each( function () {
          totalPartidas += parseInt( $( this ).html().trimEnd() );
        } );
        $( html ).find( 'span:contains(\'Vitórias\')' ).each( function () {
          totalVitorias += parseInt( $( this ).html().replace( ' Vitórias', '' ) );
        } );
        $( html ).find( 'span:contains(\'Derrotas\')' ).each( function () {
          totalDerrotas += parseInt( $( this ).html().replace( ' Derrotas', '' ) );
        } );
        porcentagemVitoria = ( ( totalVitorias / ( totalVitorias + totalDerrotas ) ) * 100 ).toFixed( 2 );
        const response = {
          dataCriacao,
          totalPartidas,
          totalVitorias,
          totalDerrotas,
          porcentagemVitoria,
          // 2 dias de cache
          ttl: Date.now() + ( 2 * 24 * 60 * 60 * 1000 )
        };
        lupaCache[id] = response;
        setStorage( 'lupaCache', lupaCache );
        resolve( response );
      } );
    } catch ( e ) {
      reject( e );
    }
  } );

  return promise;
}
