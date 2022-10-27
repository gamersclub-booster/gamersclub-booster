import { GC_URL } from '../../lib/constants';

const SELETOR_HISTORICO = 'h3:contains("Histórico")';
const LOCAT = $( location ).attr( 'href' );

const initProfilePage = () => {
  let totalPartidas = 0;
  let totalVitorias = 0;
  let totalDerrotas = 0;

  const idPlayer = LOCAT.split( '/' ).pop();

  $( '.gc-card-history-text' ).each( function () {
    totalPartidas += parseInt( $( this ).html().trimEnd() );
  } );
  $( 'span:contains(\'Vitórias\')' ).each( function () {
    totalVitorias += parseInt( $( this ).html().replace( ' Vitórias', '' ) );
  } );
  $( 'span:contains(\'Derrotas\')' ).each( function () {
    totalDerrotas += parseInt( $( this ).html().replace( ' Derrotas', '' ) );
  } );

  $.getJSON( {
    data: 'json',
    url: `https://${GC_URL}/api/box/history/${idPlayer}`
  } ).done( function ( json ) {
    const totalKillsMes = json.stat[2].value;
    const totalMortesMes = json.stat[3].value;
    const diffKills = totalKillsMes - totalMortesMes;
    const totalKdrMes = json.stat[0].value;
    const winRatio = ( ( totalVitorias / ( totalVitorias + totalDerrotas ) ) * 100 ).toFixed( 2 );

    const calcColor = ( value, base ) => {
      if ( value > base ) {
        return 'green';
      } else if ( value < base ) {
        return 'red';
      } else {
        return 'yellow';
      }
    };

    const titleHistorico = $( SELETOR_HISTORICO )[0];
    titleHistorico.innerHTML += ` -
    ${totalVitorias} Vitórias / ${totalDerrotas} Derrotas (${totalPartidas} Partidas | 
    <span style=color:${calcColor( winRatio, 50 )}>${winRatio}</span>% Win Rate) <br>
    Este mês: ${totalKillsMes} Kills / ${totalMortesMes}
    Mortes (<span style=color:${calcColor( diffKills, 0 )}>${diffKills > 0 ? `+${diffKills}` : diffKills}</span> | 
    KDR: <span style=color:${calcColor( totalKdrMes, 1 )}>${totalKdrMes}</span>)`;
  } );

};

initProfilePage();
