//GLOBAL STUFF
const log = (msg) => console.log('[GC Booster]', msg)
const profileId = +document.getElementById('GamersClubStatsBox').getAttribute('data-prop-player-id');
//"Database"
let watchedUsers;
chrome.storage.sync.get(null, function (result) {
    watchedUsers = result.watchedUsers;
    init();
});

const init = () => {
    // MEDALS BOX CONTENT STUFF
    const MEDALS_GRID = document.getElementsByClassName('gc-profile-medal-grid')[0];
    const MEDALS = MEDALS_GRID.getElementsByClassName('gc-profile-medal-grid-item');
    const MEDALS_TITLE = MEDALS_GRID.parentElement.getElementsByClassName('gc-profile-title')[0];
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

    // PROFILE BOX CONTENT STUFF
    const checked = watchedUsers.includes(profileId) ? 'checked' : '';

    const watchSelect = document.createElement('div');
    watchSelect.innerHTML = `<input type="checkbox" ${checked} id="gc-booster-watchCheckbox" style="display:none" class="custom-checkbox custom-form-btn-root"/>` +
                            '<label style="color: grey; font-family: Poppins,sans-serif; font-size:10px" for="gc-booster-watchCheckbox">'+
                            '<i class="far fa-smile-beam"></i></i></label>';

    document.getElementsByClassName('main-section')[0].firstElementChild.appendChild(watchSelect);

    document.getElementById("gc-booster-watchCheckbox").addEventListener("change", function(){
        if (document.getElementById("gc-booster-watchCheckbox").checked) {
            chrome.storage.sync.set( { watchedUsers: watchedUsers.concat( profileId ) } );
        } else {
            watchedUsers.splice( watchedUsers.indexOf(profileId), 1 );
            log('olokinho mew');
            chrome.storage.sync.set( { watchedUsers: watchedUsers } );
        }
    });
}

//class="game-modal-ready-button"