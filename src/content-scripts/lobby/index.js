import { autoAceitarReady, autoAceitarReadySetInterval } from './autoAceitarReady';
import { autoConcordarTermosRanked } from './autoConcordarTermosRanked';
import { autoFixarMenuLobby } from './autoFixarMenuLobby';
import { adicionarBotaoAutoComplete } from './botaoAutoComplete';
// import { adicionarBotaoForcarCriarLobby } from './botaoForcarCriarLobby';
import { initListaBloqueio } from './botaoListaBloqueio';
import { listaBloqueio } from './listaBloqueio';
import { lobbyLink } from './lobbyLink';
import { mostrarKdr, mostrarKdrRanked, mostrarKdrSalaIntervaler, mostrarKdrDesafios } from './mostrarKdr';
import { partidaInfo } from './partidaInfo';
import { somReady, somReadySetInterval } from './somReady';
// import { adicionarFiltroKdr } from './filtrarKdr';
import { infoChallenge, infoLobby } from './infoLobby';

import { ocultarNotificacaoComplete } from './ocultarNotificacaoComplete';
import { ocultarSugestaoDeLobbies } from './ocultarSugestaoDeLobbies';
import { tocarSomSeVoceForExpulsoDaLobby } from './tocarSomSeVoceForExpulsoDaLobby';


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
  // Esses dois não estão funcionando, verificar o motivo, criei o intervaler pra substituir por enquanto...
  criarObserver( '.lobby,.ranking', somReady );
  criarObserver( '.lobby,.ranking', autoAceitarReady );
  criarObserver( '.lobby,.ranking', autoConcordarTermosRanked );

  criarObserver( '#lobbyContent', autoFixarMenuLobby );
  criarObserver( '.lobby', lobbyLink );
  criarObserver( '#lobbyContent', listaBloqueio );

  criarObserver( '#lobbies-wrapper', mostrarKdr );
  criarObserver( '#lobbies-wrapper', infoLobby );
  criarObserver( '#challengeList', infoChallenge );
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
  mostrarKdrSalaIntervaler();
  // Feature para filtrar por KD
  // adicionarFiltroKdr();
  // Feature de discord na hora de copiar o ip
  partidaInfo();
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
