import { autoAceitarReady, autoAceitarReadySetInterval } from './autoAceitarReady';
import { autoConcordarTermosRanked } from './autoConcordarTermosRanked';
import { autoFixarMenuLobby } from './autoFixarMenuLobby';
import { adicionarBotaoAutoComplete } from './botaoAutoComplete';
// import { adicionarBotaoForcarCriarLobby } from './botaoForcarCriarLobby';
import { initListaBloqueio } from './botaoListaBloqueio';
import { listaBloqueio } from './listaBloqueio';
import { lobbyLink } from './lobbyLink';
import { autoCopyLobbyLink, resetLobbyLinkState } from './autoCopyLobbyLink';
import { mostrarInfoPlayerIntervaler, mostrarKdr, mostrarKdrDesafios, mostrarKdrRanked } from './mostrarKdr';
import { partidaInfo } from './partidaInfo';
import { somReady, somReadySetInterval } from './somReady';
// import { adicionarFiltroKdr } from './filtrarKdr';
import { infoChallenge, infoLobby } from './infoLobby';

import { autoKickNegativados } from './autoKickNegativados';
import { autoMostrarIp } from './autoMostrarIp';
import { chatFixoDireita, ocultarChat, ocultarFiltrosSala } from './chat';
import { ocultarNotificacaoComplete } from './ocultarNotificacaoComplete';
import { ocultarSugestaoDeLobbies } from './ocultarSugestaoDeLobbies';
import { tocarSomSeVoceForExpulsoDaLobby } from './tocarSomSeVoceForExpulsoDaLobby';
import { showStats } from './showStats';
import { lobbyMapSuggestions } from './lobbyMapSuggestions';

chrome.storage.sync.get( null, function ( _result ) {
  if ( window.location.pathname.includes( 'partida' ) || window.location.pathname.includes( '/match/' ) ) {
    //lobbyMapSuggestions( '25270001' );
    initLobbyPartida();
  } else {
    initLobby();
  }
} );

const initLobbyPartida = async () => {
  initListaBloqueio();
};

const initLobby = async () => {
  // Resetar estado do auto copy lobby link quando entrar no lobby
  resetLobbyLinkState();

  // Esses dois não estão funcionando, verificar o motivo, criei o intervaler pra substituir por enquanto...
  criarObserver( '.lobby,.ranking', somReady );
  criarObserver( '.lobby,.ranking', autoAceitarReady );
  criarObserver( '.lobby,.ranking', autoConcordarTermosRanked );

  criarObserver( '#lobbyContent', autoFixarMenuLobby );
  criarObserver( '.lobby', lobbyLink );
  criarObserver( '.lobby', autoCopyLobbyLink );
  criarObserver( '#lobbyContent', listaBloqueio );

  criarObserver( '#lobbies-wrapper', mostrarKdr );
  criarObserver( '#lobbies-wrapper', infoLobby );
  criarObserver( '.lobby', infoChallenge );
  criarObserver( '#GamersClubCSApp-globals-globalToaster', tocarSomSeVoceForExpulsoDaLobby );


  mostrarKdrDesafios();

  // Esconde a sugestão de lobbies para entrar
  ocultarSugestaoDeLobbies();

  //  Oculta as notificações de complete
  ocultarNotificacaoComplete();

  // Clicar automáticamente no Ready, temporário.
  somReadySetInterval();
  autoAceitarReadySetInterval();
  // Feature para aceitar complete automatico
  adicionarBotaoAutoComplete();
  // Feature pra criar lobby caso full
  // GC removeu a var de limite de lobbies, n temos solução ainda pra isso...
  // adicionarBotaoForcarCriarLobby();
  // Feature para mostrar kdr dos players
  mostrarKdrRanked();
  mostrarInfoPlayerIntervaler();
  // Feature para filtrar por KD
  // adicionarFiltroKdr();
  // Feature de discord na hora de copiar o ip
  partidaInfo();
  //Feature que mostra ip assim que server é liberado
  autoMostrarIp();
  // Feature que oculta o chat durante a criação de lobbies
  ocultarChat();
  // Feature que fixa o chat na direita
  chatFixoDireita();
  ocultarFiltrosSala();
  // Feature para auto remover negativados
  autoKickNegativados();
  // Feature para exibir as estatísticas do jogador
  showStats();
  lobbyMapSuggestions();
};

const criarObserver = ( seletor, exec, type ) => {
  const observer = new MutationObserver( mutations => {

    let shouldExec = false;
    mutations.forEach( mutation => {
      // Verifica se o elemento que sofreu a mutação é o seletor ou está dentro dele
      if ( $( mutation.target ).is( seletor ) || $( mutation.target ).closest( seletor ).length ) {
        shouldExec = true;
      }
    } );

    if ( shouldExec ) { exec( mutations, type ); }
  } );

  // Monitora o documento inteiro para pegar elementos que ainda não foram inseridos
  observer.observe( document.body, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false
  } );

};
