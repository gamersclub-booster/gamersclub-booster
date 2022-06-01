import { autoFixarMenuLobby } from './autoFixarMenuLobby';
import { autoDarkMode } from './autoDarkMode';
import { autoAceitarReady, autoAceitarReadySetInterval } from './autoAceitarReady';
import { somReady } from './somReady';
import { autoConcordarTermosRanked } from './autoConcordarTermosRanked';
import { partidaInfo } from './partidaInfo';
import { lobbyLink } from './lobbyLink';
import { listaBloqueio } from './listaBloqueio';
import { adicionarBotaoForcarCriarLobby } from './botaoForcarCriarLobby';
import { initListaBloqueio } from './botaoListaBloqueio';
import { adicionarBotaoAutoComplete } from './botaoAutoComplete';
import { addCabecalho } from './addCabecalho';
import { mostrarKdr } from './mostrarKdr';
import { adicionarFiltroKdr } from './filtrarKdr';

chrome.storage.sync.get( null, function ( _result ) {
  if ( window.location.pathname.includes( 'partida' ) || window.location.pathname.includes( '/match/' ) ) {
    initLobbyPartida();
  } else {
    initLobby();
  }
} );

const initLobbyPartida = async () => {
  initListaBloqueio();
};

const initLobby = async () => {
  criarObserver( '.lobby,.ranking', somReady );
  criarObserver( '.lobby,.ranking', autoAceitarReady );
  criarObserver( '#lobbyContent', autoFixarMenuLobby );
  criarObserver( '#lobbyContent', autoDarkMode );
  criarObserver( '.lobby,.ranking', autoConcordarTermosRanked );
  criarObserver( '#lobbyContent', lobbyLink );
  criarObserver( '#lobbyContent', listaBloqueio );
  criarObserver( '.list-avaliable-teams', mostrarKdr );
  criarObserver( '#challengeList', mostrarKdr );

  // Cria seção de cabeçalho para botões da extensão
  addCabecalho();
  // Clicar automáticamente no Ready, temporário.
  autoAceitarReadySetInterval();
  // Feature para aceitar complete automatico
  adicionarBotaoAutoComplete();
  // Feature pra criar lobby caso full
  adicionarBotaoForcarCriarLobby();
  // Feature para mostrar kdr dos players
  mostrarKdr();
  // Feature para filtrar por KD
  adicionarFiltroKdr();
  // Feature de discord na hora de copiar o ip
  partidaInfo();
};

const criarObserver = ( seletor, exec ) => {
  if ( $( seletor ).length > 0 ) {
    const observer = new MutationObserver( mutations => {
      exec( mutations );
    } );
    observer.observe( $( seletor ).get( 0 ), {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    } );
  }
};
