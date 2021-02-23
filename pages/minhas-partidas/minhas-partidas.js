const GC_API_URL = '';
const SELETOR_LINK_PARTIDAS = 'a:contains("Ver partida")';

const buscaLinksDasPartidas = () => {
    let partidas = [];
    $(SELETOR_LINK_PARTIDAS).each(function () {
        partidas.push(this.href);
    });
    return partidas;
};

const verificarBans = async (partida, statsColumns) => {
    try {
        const resposta = await fetch(partida + '/1');
        const dadosPartida = await resposta.json();
        const temBanidos =
            dadosPartida.jogos.players.team_a.some((jogador) => jogador.player.banned) ||
            dadosPartida.jogos.players.team_b.some((jogador) => jogador.player.banned);
        if (temBanidos) {
            $(statsColumns).children('.medium-offset-1').removeClass('medium-offset-1');
            $(statsColumns).prepend(
                $('<div></div>')
                    .addClass('columns medium-1')
                    .attr('title', 'Esta partida possui jogador banido')
                    .append(
                        $('<i></i>')
                            .addClass('fa fa-exclamation-triangle')
                            .attr('aria-hidden', true)
                            .css({ 'color': 'red', 'font-size': '35px', 'margin-top': '5px' })
                    )
            );
        } else {
            $(statsColumns).children('.medium-offset-1').removeClass('medium-offset-1');
            $(statsColumns).prepend(
                $('<div></div>')
                    .addClass('columns medium-1')
                    .attr('title', 'Não há jogadores banidos nesta partida')
                    .append(
                        $('<i></i>')
                            .addClass('fa fa-check-circle')
                            .attr('aria-hidden', true)
                            .css({ 'color': 'green', 'font-size': '35px', 'margin-top': '5px' })
                    )
            );
        }
    } catch (e) {
        log('Fetch errored, trying again.');
        return verificarBans(partida, statsColumns);
    }
};

// content.js
const initVerificarBans = async () => {
    const partidas = buscaLinksDasPartidas();
    const statsColumns = $(SELETOR_LINK_PARTIDAS).parent().parent();
    const promises = partidas.map((partida, index) => verificarBans(partida, statsColumns[index]));
    await Promise.all(promises);
};

(async () => {
    $('body').on('DOMNodeInserted', '#myMatchesPagination', async function () {
        //Wait 5 seconds before start;
        log('Page changed, running.');
        await new Promise((r) => setTimeout(r, 3000));
        initVerificarBans();
    });

    initVerificarBans();
})();
