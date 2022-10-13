const SELETOR_HISTORICO = 'h3:contains("Histórico")';
const LOCAT = $( location ).attr( 'href' );

const initProfilePage = () => {
  let totalVitorias = 0;
  let totalDerrotas = 0;

  const idPlayer = LOCAT.split( '/' ).pop();

  $( 'span:contains(\'Vitórias\')' ).each( function () {
    totalVitorias += parseInt( $( this ).html().replace( ' Vitórias', '' ) );
  } );
  $( 'span:contains(\'Derrotas\')' ).each( function () {
    totalDerrotas += parseInt( $( this ).html().replace( ' Derrotas', '' ) );
  } );
  const gcHost = window.location.hostname;
  $.getJSON( {
    dataType: 'json',
    url: `https://${gcHost}/api/box/history/${idPlayer}`
  } ).done( function ( json ) {
    const totalKillsMes = json.stat[2].value;
    const totalMortesMes = json.stat[3].value;
    const diffKills = totalKillsMes - totalMortesMes;
    const totalKdrMes = json.stat[0].value;
    const winRatio = ( ( totalVitorias / ( totalVitorias + totalDerrotas ) ) * 100 ).toFixed( 2 );
    const titleHistorico = $( SELETOR_HISTORICO )[0];
    titleHistorico.innerHTML += ` - 
    ${totalVitorias} Vitórias / ${totalDerrotas} Derrotas (${winRatio}% Win Rate) <br>
    Este mês: ${totalKillsMes} Kills / ${totalMortesMes}
    Mortes (${diffKills > 0 ? `+${diffKills} |` : `${diffKills} |`} KDR: ${totalKdrMes})`;
  } );

};

initProfilePage();
