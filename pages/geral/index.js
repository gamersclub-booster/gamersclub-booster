const log = (msg) => console.log('[GC Booster]', msg);
const GC_URL = window.location.hostname;
let generalOptions = [];
chrome.storage.sync.get(null, function (result) {
    generalOptions = result;
    initGcBooster();
});

const levelRatingXP = [1000, 1056, 1116, 1179, 1246, 1316, 1390, 1469, 1552, 1639, 1732, 1830, 1933, 2042, 2158, 2280, 2408, 2544, 2688, 2840, 2999];
const levelColor = ['#000', '#643284', '#5c2d84', '#532883', '#492381', '#402686', '#2d3a8a', '#2967b0', '#2967b0', '#2a7bc2', '#2a8acc', '#3e9cb7', '#53a18b', '#68a761', '#7cac35', '#91b20a', '#bdb700', '#f0bc00', '#f89a06', '#f46e12', '#eb2f2f'];

function XpRangeFromLevel(level) {
    return {
        minRating: levelRatingXP[level - 1],
        maxRating: levelRatingXP[level]
    }
}

// Um helper para pegar a var necessaria.
function retrieveWindowVariables(variables) {
    var ret = {};

    var scriptContent = "";
    for (var i = 0; i < variables.length; i++) {
        var currVariable = variables[i];
        scriptContent += "if (typeof " + currVariable + " !== 'undefined') $('body').attr('tmp_" + currVariable + "', " + currVariable + ");\n"
    }

    var script = document.createElement('script');
    script.id = 'tmpScript';
    script.appendChild(document.createTextNode(scriptContent));
    (document.body || document.head || document.documentElement).appendChild(script);

    for (var i = 0; i < variables.length; i++) {
        var currVariable = variables[i];
        ret[currVariable] = $("body").attr("tmp_" + currVariable);
        $("body").removeAttr("tmp_" + currVariable);
    }

    $("#tmpScript").remove();

    return ret;
}

const initGcBooster = async () => {
    if ( generalOptions.mostrarLevelProgress ) {
        var windowVariables = retrieveWindowVariables(['PLAYERID', 'ISSUBSCRIBER']);
        const PlayerID = windowVariables.PLAYERID;
        const isSubscriber = windowVariables.ISSUBSCRIBER;
        $.get( `//${GC_URL}/api/box/init/` + parseInt(PlayerID) ).done( function( data ) {
            const playerLevel = data.playerInfo.level;
            const currentRating = data.playerInfo.rating;

            const minPontos = XpRangeFromLevel(playerLevel).minRating;
            const maxPontos = XpRangeFromLevel(playerLevel).maxRating;

            const pontosCair = minPontos - currentRating;
            const pontosSubir = maxPontos - currentRating;

            const playerNextLevel = playerLevel == 20 ? 21 : playerLevel + 1;
            const progressBar = maxPontos ? `${((currentRating - minPontos) / (maxPontos - minPontos)) * 100}%` : '100%';

            const strText = playerNextLevel == 21 ? "" : "Skill Level " + playerNextLevel;
            const nextLvl = playerNextLevel == 21 ? "" : playerNextLevel;

            const fixedNum = parseFloat(progressBar).toFixed(4);
            const subscriberStyle = isSubscriber === "true" ? 'subscriber' : 'nonSubscriber';
            $('.MainHeader__navbarBlock:last').before(`<div style="display: flex;align-items: center;font-size: 12px;justify-content: center;width: 100%;">
                <span title="Skill Level ${playerLevel}" style="display: inline-block;" data-tip-text="Skill Level ${playerLevel}">
                <div class="PlayerLevel PlayerLevel--${playerLevel} PlayerLevel--${subscriberStyle}" style="height: 28px; width: 28px; font-size: 12px;"><div class="PlayerLevel__background"><span class="PlayerLevel__text">${playerLevel}</span></div></div>
                </span>
                <div style="margin-right: 4px;margin-left: 4px;">
                    <div class="text-light" style="display: flex; justify-content: space-between;">
                        <div class="text-sm text-muted bold" style="align-self: flex-end;">&nbsp;</div>
                        <div style="display: flex; align-items: center; justify-content: flex-end;">
                            <span style="cursor: help;" title="Rating atual">${currentRating}</span>
                            <i class="fas fa-chart-line" style="margin-left:4px;"></i>
                        </div>
                    </div>
                    <div>
                        <div style="margin: 1px 0px;height: 2px;width: 160px;background: rgb(75, 78, 78);">

                            <div style="height: 100%;width:${fixedNum}%; background: linear-gradient(to right, ${levelColor[playerLevel]}, ${levelColor[playerNextLevel] || levelColor[playerLevel]});"></div>
                        </div>
                        <div class="text-sm text-muted bold" style="display: flex; justify-content: space-between;">${minPontos}<span><span style="cursor: help;" title="Quantidade de pontos para cair de Level">${pontosCair}</span>/<span style="cursor: help;" title="Quantidade de pontos para subir de Level">+${pontosSubir}</span></span><span>${maxPontos}</span></div>
                    </div>
                </div>
                <span title="${strText}" style="display: ${playerNextLevel > 20 ? 'none' : 'inline-block'}">
                    <div class="PlayerLevel PlayerLevel--${playerNextLevel} PlayerLevel--${subscriberStyle}" style="height: 28px; width: 28px; font-size: 12px;"><div class="PlayerLevel__background"><span class="PlayerLevel__text">${nextLvl}</span></div></div>
                </span>
                <span title="${strText}" style="display: ${playerNextLevel > 20 ? 'inline-block' : 'none'}">
                    <div class="PlayerLevel PlayerLevel--${playerLevel} PlayerLevel--${subscriberStyle}" style="height: 28px; width: 28px; font-size: 12px;"><div class="PlayerLevel__background"><span class="PlayerLevel__text"><i class="far fa-star"></i></span></div></div>
                </span>
            </div>`);
        }).fail(e=>log({e}));
    }
};
