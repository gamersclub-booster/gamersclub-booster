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
    dataType: 'json',
    url: `https://${GC_URL}/api/box/history/${idPlayer}`
  } ).done( function ( json ) {
    const totalKillsMes = json.stat[2].value;
    const totalMortesMes = json.stat[3].value;
    const diffKills = totalKillsMes - totalMortesMes;
    const totalKdrMes = json.stat[0].value;
    const winRatio = ( ( totalVitorias / ( totalVitorias + totalDerrotas ) ) * 100 ).toFixed( 2 );
    const styledWinRatio = winRatio >= 50 ?
      `<span style=color:green>${winRatio}</span>` : `<span style=color:red>${winRatio}</span>`;

    const styledDiffKills = () => {
      if ( diffKills > 0 ) {
        return `<span style=color:green>+${diffKills}</span>`;
      } else if ( diffKills < 0 ) {
        return `<span style=color:red>${diffKills}</span>`;
      } else {
        return `<span style=color:yellow>${diffKills}</span>`;
      }
    };

    const styledKdrMes = () => {
      if ( totalKdrMes >= 1 ) {
        return `<span style=color:green>${totalKdrMes}</span>`;
      } else if ( totalKdrMes < 1 ) {
        return `<span style=color:red>${totalKdrMes}</span>`;
      } else {
        return `<span style=color:yellow>${totalKdrMes}</span>`;
      }
    };
    const titleHistorico = $( SELETOR_HISTORICO )[0];
    titleHistorico.innerHTML += ` -
    ${totalVitorias} Vitórias / ${totalDerrotas} Derrotas (${totalPartidas} Partidas | 
      ${styledWinRatio}% Win Rate) <br>
    Este mês: ${totalKillsMes} Kills / ${totalMortesMes}
    Mortes (${styledDiffKills()} | KDR: ${styledKdrMes()})`;
  } );

};

initProfilePage();
