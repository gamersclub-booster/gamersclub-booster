//GLOBAL STUFF
const log = (msg) => console.log('[GC Booster] ', msg)
const profileId = +document.getElementById('GamersClubStatsBox').getAttribute('data-prop-player-id');

const SELETOR_MEDALHAS = 'h3:contains("Medalhas")'
const SELETOR_CONQUISTAS = 'h3:contains("Conquistas")'
//"Database"
// let watchedUsers = [];
// let toxicPlayers = [];
// let goodPlayers = [];
let options = {};
let autoEsconderMedalhas = false;
let autoEsconderConquistas = false;
chrome.storage.sync.get(null, function (result) {
    options = result;
    // watchedUsers = result.watchedUsers ? result.watchedUsers : [];
    // goodPlayers = result.goodPlayers ? result.goodPlayers : [];
    // toxicPlayers = result.toxicPlayers ? result.toxicPlayers : [];
    init();
});

const init = () => {
    // MEDALS BOX CONTENT STUFF
    const MEDALS_GRID = document.getElementsByClassName('gc-profile-medal-grid')[0];
    const MEDALS = MEDALS_GRID.getElementsByClassName('gc-profile-medal-grid-item');
    // const MEDALS_TITLE = MEDALS_GRID.parentElement.getElementsByClassName('gc-profile-title')[0];
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
    // PROFILE BOX CONTENT STUFF
    // const actionsDiv = document.createElement('div');
    //Good/Nice player
    // const checkedGoodPlayer = goodPlayers.includes(profileId) ? 'checked' : '';
    // const goodPlayerColor = goodPlayers.includes(profileId) ? 'green' : '';

    // const goodPlayersSelect = document.createElement('div');
    // goodPlayersSelect.innerHTML = `<input type="checkbox" ${checkedGoodPlayer} id="gc-booster-goodPlayerCheckbox" style="" class="custom-checkbox custom-form-btn-root"/>` +
    //                         '<label style="color: grey; font-family: Poppins,sans-serif; font-size:10px" for="gc-booster-goodPlayerCheckbox">'+
    //                         `<i class="far fa-smile-beam" id="good-player-icon" style="font-size:30px;color:${goodPlayerColor}"></i></i></label>`;

    // document.getElementsByClassName('main-section')[0].firstElementChild.appendChild(goodPlayersSelect);

    // document.getElementById("gc-booster-goodPlayerCheckbox").addEventListener("change", function(){
    //     if (document.getElementById("gc-booster-goodPlayerCheckbox").checked) {
    //         document.getElementById("good-player-icon").style.color = "green";
    //         chrome.storage.sync.set( { goodPlayers: goodPlayers.concat( profileId ) } );
    //     } else {
    //         goodPlayers.splice( goodPlayers.indexOf(profileId), 1 );
    //         chrome.storage.sync.set( { goodPlayers: goodPlayers } );
    //         document.getElementById("good-player-icon").style.color = "";
    //     }
    // });
    // //Toxic player
    // const checkedToxicPlayer = toxicPlayers.includes(profileId) ? 'checked' : '';
    // const toxicPlayerColor = toxicPlayers.includes(profileId) ? 'red' : '';

    // const toxicPlayersSelect = document.createElement('div');
    // toxicPlayersSelect.innerHTML = `<input type="checkbox" ${checkedToxicPlayer} id="gc-booster-toxicPlayerCheckbox" style="" class="custom-checkbox custom-form-btn-root"/>` +
    //                         '<label style="color: grey; font-family: Poppins,sans-serif; font-size:10px" for="gc-booster-toxicPlayerCheckbox">'+
    //                         `<i class="fas fa-biohazard" id="toxic-player-icon" style="font-size:30px;color:${toxicPlayerColor}"></i></i></label>`;

    // document.getElementsByClassName('main-section')[0].firstElementChild.appendChild(toxicPlayersSelect);

    // document.getElementById("gc-booster-toxicPlayerCheckbox").addEventListener("change", function(){
    //     if (document.getElementById("gc-booster-toxicPlayerCheckbox").checked) {
    //         document.getElementById("toxic-player-icon").style.color = "red";
    //         chrome.storage.sync.set( { toxicPlayers: toxicPlayers.concat( profileId ) } );
    //     } else {
    //         toxicPlayers.splice( toxicPlayers.indexOf(profileId), 1 );
    //         chrome.storage.sync.set( { toxicPlayers: toxicPlayers } );
    //         document.getElementById("toxic-player-icon").style.color = "";
    //     }
    // });
}

//class="game-modal-ready-button"