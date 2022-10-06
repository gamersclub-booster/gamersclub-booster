const SELETOR_HISTORICO = 'h3:contains("Histórico")';
const BASE_URL = 'https://gamersclub.com.br';

const initProfilePage = () => {
  let totalVitorias = 0;
  let totalDerrotas = 0;
  const idPlayer = $( location ).attr( 'href' ).replace( `${ BASE_URL }/player/`, '' ).
    replace( `${ BASE_URL }/jogador/`, '' );
  $( 'span:contains(\'Vitórias\')' ).each( function () {
    totalVitorias += parseInt( $( this ).html().replace( ' Vitórias', '' ) );
  } );
  $( 'span:contains(\'Derrotas\')' ).each( function () {
    totalDerrotas += parseInt( $( this ).html().replace( ' Derrotas', '' ) );
  } );
  $.getJSON( {
    dataType: 'json',
    url: `https://gamersclub.com.br/api/box/history/${idPlayer}`
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

