const GC_API_URL = '//gamersclub.com.br/campeonatos/getEndedMatchMaps';
const SELETOR_LINK_PARTIDAS = 'a:contains("Ver partida")'

const log = ( msg ) => console.log('[GC Booster] ',  msg );
const pegarIdPartida = ( link ) => link.split('/')[7];

const adicioanrLinksVerMapas = () => {
    $( SELETOR_LINK_PARTIDAS ).each( function () {
        if( $( this ).attr('class').includes('finished')) {
            const idPartida = pegarIdPartida(this.href);
            const botaoRevelarMapa =  $( `<a class="button-date-table ">Revelar Mapa </a>` );
            botaoRevelarMapa.click( function() { revelarMapa( idPartida, botaoRevelarMapa ); });
            $( this ).parent().append( botaoRevelarMapa );
        }
    });
}

const revelarMapa = async ( partida, elemento, tentativas = 0 ) => {
    try {
        if (tentativas > 3) {
            return;
        }
        const resposta = await fetch( `${GC_API_URL}/${partida}` );
        const dadosPartida = await resposta.json();
        log(dadosPartida.maps);
        log(Object.keys(dadosPartida.maps));
        log(Object.keys(dadosPartida.maps).join(', '));
        const mapas = Object.keys(dadosPartida.maps).join(', ');
        if (mapas) {
            elemento.html(mapas);
        } else { 
            elemento.html('W.O.');
        }
        elemento.addClass('finished');
    } catch (e) {
        log( 'Deu erro, tentando dnv' );
        revelarMapa( partida, elemento, tentativas+1 );
    }
}

// content.js
const run = async () => {
    const partidas = adicioanrLinksVerMapas();
}

(async () => {
    run();
})();



