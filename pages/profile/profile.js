const SELETOR_HISTORICO = 'h3:contains("Histórico")';

let options = {};
chrome.storage.sync.get(null, function (result) {
    options = result;
    initProfilePage();
});

const initProfilePage = () => {
    let totalVitorias = 0;
    let totalDerrotas = 0;
    $("span:contains('Vitórias')").each(function () {
        totalVitorias += parseInt($(this).html().replace(' Vitórias', ''))
    });
    $("span:contains('Derrotas')").each(function () {
        totalDerrotas += parseInt($(this).html().replace(' Derrotas', ''))
    });
    const winRatio = ((totalVitorias / (totalVitorias + totalDerrotas)) * 100).toFixed(2);
    const titleHistorico = $(SELETOR_HISTORICO)[0];
    titleHistorico.innerHTML += ` - ${totalVitorias}/${totalDerrotas} (${winRatio}%)`;
}
