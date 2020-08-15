const GC_API_URL = '';
const SELETOR_LINK_PARTIDAS = 'a:contains("Ver partida")'

const log = ( msg ) => console.log('[GC Booster] ',  msg );

const buscaLinksDasPartidas = () => {
    let partidas = [];
    $( SELETOR_LINK_PARTIDAS ).each( function() {
        partidas.push( this.href ); 
    });
    return partidas;   
}

const verificarBans = async ( partida, matchColumn ) => {
    try {
        const resposta = await fetch( partida + '/1' );
        const dadosPartida = await resposta.json();
        const temBanidos = dadosPartida.jogos.players.team_a.some( jogador => jogador.player.banned) || dadosPartida.jogos.players.team_b.some( jogador => jogador.player.banned);
        if ( temBanidos ) {
            matchColumn.style.background = 'red';
        } else {
			matchColumn.style.background = 'green';

		}
    } catch (e) {
        log( 'Fetch errored, trying again.' );
        return verificarBans( partida, matchColumn );
    }
}

// content.js
const run = async () => {
    const partidas = buscaLinksDasPartidas();
    const matchColumns = $('span.versus').parent().parent();
    const promises = partidas.map( ( partida, index ) => verificarBans( partida, matchColumns[ index ] ) );
    await Promise.all( promises );
}

(async () => {
    $( 'body' ).on( 'DOMNodeInserted', '#myMatchesPagination', async function() {
        //Wait 5 seconds before start;
        log( 'Page changed, running.' )
        await new Promise( r => setTimeout( r, 3000 ) );
        run();
    });

    run();
})();



