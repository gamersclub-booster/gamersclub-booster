
const log = (msg) => console.log('[GC Booster]', msg)

// MEDALS BOX CONTENT STUFF
const MEDALS_GRID = document.getElementsByClassName('gc-profile-medal-grid')[0];
const MEDALS = MEDALS_GRID.getElementsByClassName('gc-profile-medal-grid-item');
const MEDALS_TITLE = MEDALS_GRID.parentElement.getElementsByClassName('gc-profile-title')[0];
const SHOW_HIDE_MEDALS = '<button id="showHideMedals" style="border:1px solid;width: 110px;margin-left: 10px;">Esconder</button>'
MEDALS_TITLE.innerHTML += ` (${MEDALS.length}) ${SHOW_HIDE_MEDALS}`;
document.getElementById("showHideMedals").addEventListener("click", function(){
    if (MEDALS_GRID.style.display === "none") {
        MEDALS_GRID.style.display = "grid";
        document.getElementById("showHideMedals").innerText = "Esconder";
    } else {
        MEDALS_GRID.style.display = "none";
        document.getElementById("showHideMedals").innerText = "Mostrar";
    }
});
