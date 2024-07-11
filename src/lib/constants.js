export const levelRatingXP = [
  1000,
  1056,
  1116,
  1179,
  1246,
  1316,
  1390,
  1469,
  1552,
  1639,
  1732,
  1830,
  1933,
  2042,
  2158,
  2280,
  2408,
  2544,
  2688,
  2840,
  2999,
  3000
];
export const levelColor = [
  '#000000',
  '#643284',
  '#5c2d84',
  '#532883',
  '#492381',
  '#402686',
  '#2d3a8a',
  '#2967b0',
  '#2967b0',
  '#2a7bc2',
  '#2a8acc',
  '#3e9cb7',
  '#53a18b',
  '#68a761',
  '#7cac35',
  '#91b20a',
  '#bdb700',
  '#f0bc00',
  '#f89a06',
  '#f46e12',
  '#eb2f2f',
  '#ff00c0'
];
export const features = [
  'autoCopiarIp',
  'autoAceitarReady',
  'autoFixarMenuLobby',
  'ocultarSugestaoDeLobbies',
  'ocultarNotificacaoComplete',
  'autoDarkMode',
  'autoCompactMode',
  'autoConcordarTermosRanked',
  'mostrarLevelProgress',
  'warmupTimer',
  'enviarLinkLobby',
  'enviarPartida',
  'lobbyPrivada'
];
export const preVetosMapas = [
  {
    mapa: 'de_dust2',
    codigo: 1
  },
  {
    mapa: 'de_nuke',
    codigo: 2
  },
  {
    mapa: 'de_train',
    codigo: 3
  },
  {
    mapa: 'de_mirage',
    codigo: 5
  },
  {
    mapa: 'de_overpass',
    codigo: 7
  },
  {
    mapa: 'de_inferno',
    codigo: 8
  },
  {
    mapa: 'de_vertigo',
    codigo: 10
  },
  // {
  //   mapa: 'de_cbble_classic',
  //   codigo: 11
  // },
  {
    mapa: 'de_ancient',
    codigo: 12
  },
  // {
  //   mapa: 'de_tuscan',
  //   codigo: 13
  // },
  {
    mapa: 'de_anubis',
    codigo: 14
  }
  // {
  //   mapa: 'de_cache_old',
  //   codigo: 16
  // }
];
export const configValues = [ 'somReady', 'volume', 'customSomReady', 'somKicked' ];
export const paginas = [ 'novidades', 'geral', 'mapas', 'lobby', 'complete', 'contato', 'sobre', 'sons', 'integracoes', 'blocklist',
  'backup', 'doacao' ];
export const audios = {
  '': 'Nenhum',
  'https://www.myinstants.com/media/sounds/whatsapp_ptt_2021-04-04_at_21.mp3': 'Partida encontrada',
  'https://www.myinstants.com/media/sounds/esl-pro-league-season-11-north-america-mibr-vs-furia-mapa-iii-mirage-mp3cut.mp3':
    'Começou - Gaules',
  'https://www.myinstants.com/media/sounds/wakeup_1QLWl1G.mp3': 'Wake Up - TeamSpeak',
  'https://www.myinstants.com/media/sounds/onarollbrag13.mp3': 'Easy Peasy - CS:GO',
  'https://www.myinstants.com/media/sounds/que-ota_-17.mp3': 'Qué Ota? - LUCAS1',
  'https://www.myinstants.com/media/sounds/tuturu_1.mp3': 'Tuturu - Steins;Gate',
  'https://www.myinstants.com/media/sounds/cs_go-fallen-incredible-1v5-against-na_vi-at-iem-katowice-2016-_live_-2m23.mp3':
    'Stop Blowing my mind - Fallen',
  'https://www.myinstants.com/media/sounds/fnx-qm-ta-triste-nao-ta-mais_WXNDST4.mp3': 'Quem tá triste não tá mais - Fnx',
  'https://www.myinstants.com/media/sounds/foto-na-parede.mp3': 'Coloca minha foto na sua parede - Kng',
  'https://www.myinstants.com/media/sounds/gau-desbane-o-v2.mp3': 'Gau desbane o v2?',
  'https://www.myinstants.com/media/sounds/bt0-pega-o-guanabara-e-vem.mp3': 'Bt0 - Pega o guanabara e vem',
  'custom': 'Customizar'
};
export const GC_URL = window.location.hostname;

// Opera 8.0+ (tested on Opera 42.0)
export const isOpera = ( !!window.opr && !!opr.addons ) || !!window.opera ||
                navigator.userAgent.indexOf( ' OPR/' ) >= 0;

// Firefox 1.0+ (tested on Firefox 45 - 53)
export const isFirefox = typeof InstallTrigger !== 'undefined';

// Internet Explorer 6-11
//   Untested on IE (of course). Here because it shows some logic for isEdge.
export const isIE = /*@cc_on!@*/false || !!document.documentMode;

// Edge 20+ (tested on Edge 38.14393.0.0)
export const isEdge = !isIE && !!window.StyleMedia;

// Chrome 1+ (tested on Chrome 55.0.2883.87)
// This does not work in an extension:
//export const isChrome = !!window.chrome && !!window.chrome.webstore;
// The other browsers are trying to be more like Chrome, so picking
// capabilities which are in Chrome, but not in others is a moving
// target.  Just default to Chrome if none of the others is detected.
export const isChrome = !isOpera && !isFirefox && !isIE && !isEdge;

// Blink engine detection (tested on Chrome 55.0.2883.87 and Opera 42.0)
export const isBlink = ( isChrome || isOpera ) && !!window.CSS;

// Header apis
export const headers = {
  Authorization: 'Basic Z2MtYm9vc3RlcjowZG5tTjBKVDNMQXcwc3B5SVVJck13NHI'
};
