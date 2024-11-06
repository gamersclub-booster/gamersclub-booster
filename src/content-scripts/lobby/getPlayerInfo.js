import { getFromStorage, setStorage } from '../../lib/storage';

const BASE_URL = 'https://gamersclub.com.br/player';

const SELETOR_DATA_CRIACAO = '.gc-list-title:contains("Registrado em")';

const DOIS_DIAS = ( 2 * 24 * 60 * 60 * 1000 );

// Limpa o cache a cada 2 dias se o TTL for menor q 'agora'
const limparCache = async () => {
  const cache = await getFromStorage( 'lupaCache' ) || {};
  for ( const [ id, obj ] of Object.entries( cache ) ) {
    if ( obj.ttl <= Date.now() ) {
      delete cache[id];
    }
  }
  await setStorage( 'lupaCache', cache );
  await setStorage( 'ultimaLimpezaCache', Date.now() );
};

const getAnotacao = html => {
  if ( $( html ).find( '.gc-button-notes-negative' )[0] ) {
    return 'Negativa';
  }
  if ( $( html ).find( '.gc-button-notes-positive' )[0] ) {
    return 'Positiva';
  }
  return 'Nenhuma';
};

export async function getPlayerInfo( id ) {
  const ultimaLimpezaCache = await getFromStorage( 'ultimaLimpezaCache' );
  if ( !ultimaLimpezaCache || ultimaLimpezaCache < Date.now() - DOIS_DIAS ) {
    await limparCache();
  }
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

        const anotacao = getAnotacao( html );
        const response = {
          dataCriacao,
          totalPartidas,
          porcentagemVitoria,
          anotacao,
          // 2 dias de cache
          ttl: Date.now() + DOIS_DIAS
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
