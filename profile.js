
const MEDALS_GRID = document.getElementsByClassName('gc-profile-medal-grid')[0];
const MEDALS = MEDALS_GRID.getElementsByClassName('gc-profile-medal-grid-item');
const MEDALS_TITLE = document.querySelector('body > div.animsition > div.body-page.bg1.noads.has-chat > div > div > div.gc-profile > div.gc-profile-container > div.gc-profile-content > div:nth-child(3) > div.gc-profile-box-header > h3');
const log = (msg) => console.log('[GC Booster]', msg)

MEDALS_TITLE.innerHTML += ` (${MEDALS.length})`;