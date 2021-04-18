import { GC_URL } from '../../lib/constants';
const GC_API_URL = `//${GC_URL}/campeonatos/getEndedMatchMaps`;
const DEMO_URL = `//${GC_URL}/api/ebacon2/stats/scoreboards`;
const SELETOR_LINK_PARTIDAS = 'a:contains("Ver partida")';

const pegarIdPartida = link => link.split( '/' )[7];

const adicioanrLinks = () => {
  $( SELETOR_LINK_PARTIDAS ).each( function () {
    $( this ).parent().css( { 'width': '235px', 'text-align': 'center' } );
    if ( $( this ).attr( 'class' ).includes( 'finished' ) ) {
      const idPartida = pegarIdPartida( this.href );
      const botaoRevelarMapa = $( '<a class="button-date-table" style="margin-top:4px">Mapa</a>' );
      botaoRevelarMapa.on( 'click', function () {
        revelarMapa( idPartida, botaoRevelarMapa );
      } );
      $( this ).parent().append( botaoRevelarMapa );

      const idCamp = this.href.split( '/' )[5];
      const botaoDemo = $( '<a class="button-date-table" style="margin:4px">Demo</a>' );
      botaoDemo.on( 'click', function () {
        baixarDemo( idPartida, idCamp );
      } );
      $( this ).parent().append( botaoDemo );
    }
  } );
};

const baixarDemo = async ( partida, campeonato, tentativas = 0 ) => {
  try {
    if ( tentativas > 3 ) {
      return;
    }
    const resposta = await fetch( `${DEMO_URL}/${campeonato}/${partida}` );
    const dadosPartida = await resposta.json();
    dadosPartida.forEach( function ( partida ) {
      const link = $( `<a target="_blank" href=${partida.demo}></a>` );
      $( 'body' ).append( link );
      link[0].click();
      $( 'body' ).remove( link );
    } );
  } catch ( e ) {
    revelarMapa( partida, campeonato, tentativas + 1 );
  }
};

const revelarMapa = async ( partida, elemento, tentativas = 0 ) => {
  try {
    if ( tentativas > 3 ) {
      return;
    }
    const resposta = await fetch( `${GC_API_URL}/${partida}` );
    const dadosPartida = await resposta.json();
    const mapas = Object.keys( dadosPartida.maps ).join( ', ' );
    if ( mapas ) {
      elemento.html( mapas );
    } else {
      elemento.html( 'W.O.' );
    }
    elemento.addClass( 'finished' );
  } catch ( e ) {
    revelarMapa( partida, elemento, tentativas + 1 );
  }
};

const initPartidas = async () => {
  adicioanrLinks();
};

( async () => {
  initPartidas();
} )();
