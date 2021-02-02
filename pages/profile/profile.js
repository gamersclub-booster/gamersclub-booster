const profileId = +document.getElementById('GamersClubStatsBox').getAttribute('data-prop-player-id');
const SELETOR_MEDALHAS = 'h3:contains("Medalhas")'
const SELETOR_CONQUISTAS = 'h3:contains("Conquistas")'

let options = {};
chrome.storage.sync.get(null, function (result) {
    options = result;
    initProfilePage();
});

const initProfilePage = () => {
    // MEDALS BOX CONTENT STUFF
    const MEDALS_GRID = document.getElementsByClassName('gc-profile-medal-grid')[0];
    const MEDALS = MEDALS_GRID.getElementsByClassName('gc-profile-medal-grid-item');
    const MEDALS_TITLE = $( SELETOR_MEDALHAS )[0];
    const SHOW_HIDE_MEDALS = '<button id="gc-booster-showHideMedals" style="border:1px solid;width: 110px;margin-left: 10px;">Esconder</button>'
    MEDALS_TITLE.innerHTML += ` (${MEDALS.length}) ${SHOW_HIDE_MEDALS}`;
    document.getElementById("gc-booster-showHideMedals").addEventListener("click", function(){
        if (MEDALS_GRID.style.display === "none") {
            MEDALS_GRID.style.display = "grid";
            document.getElementById("gc-booster-showHideMedals").innerText = "Esconder";
        } else {
            MEDALS_GRID.style.display = "none";
            document.getElementById("gc-booster-showHideMedals").innerText = "Mostrar";
        }
    });
    if (options.autoEsconderMedalhas) {
        document.getElementById('gc-booster-showHideMedals').click();
    }


    const ACHIEVEMENT = document.getElementsByClassName('gc-profile-achievement')[0];
    const ACHIEVEMENT_TITLE =  $( SELETOR_CONQUISTAS )[0];
    const SHOW_HIDE_ACHIEVEMENT  = '<button id="gc-booster-showHideAchievement" style="border:1px solid;width: 110px;margin-left: 10px;">Esconder</button>'
    ACHIEVEMENT_TITLE.innerHTML += `${SHOW_HIDE_ACHIEVEMENT}`;
    document.getElementById("gc-booster-showHideAchievement").addEventListener("click", function(){
        if (ACHIEVEMENT.style.display === "none") {
            ACHIEVEMENT.style.display = "flex";
            document.getElementById("gc-booster-showHideAchievement").innerText = "Esconder";
        } else {
            ACHIEVEMENT.style.display = "none";
            document.getElementById("gc-booster-showHideAchievement").innerText = "Mostrar";
        }
    });
    if (options.autoEsconderConquistas) {
        document.getElementById('gc-booster-showHideAchievement').click();
    }
}
