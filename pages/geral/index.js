const log = (msg) => console.log("[GC Booster] ", msg);

let generalOptions = [];
chrome.storage.sync.get(null, function (result) {
    generalOptions = result;
    initGcBooster();
});

const initGcBooster = async () => {
    if ($("#GamersClubStatsBox").is(":visible")) {
        const minPontos = $(".StatsBoxProgressBar__minRating").text();
        const maxPontos = $(".StatsBoxProgressBar__maxRating").text();
        const atualPontos = $(".StatsBoxRating__Score").text();
        const pontosSubir = maxPontos - atualPontos;
        const pontosCair = minPontos - atualPontos;
        $(".StatsBoxRating__Header").append(`<span style="font-size:10px">${pontosCair} / ${pontosSubir}</span>`);
    }
};
