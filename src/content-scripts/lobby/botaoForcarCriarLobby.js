import { retrieveWindowVariables } from '../../lib/dom';
import axios from 'axios';


let intervalCriarLobby = null;

export function adicionarBotaoForcarCriarLobby() {
  if ( $( '#lobbyContent > div.row.lobby-rooms-content > div > div > div:nth-child(3)' ).length > 0 ) {
    $( '#lobbyContent > div.row.lobby-rooms-content > div > div > div:nth-child(3)' ).html(
      '<button id="forcarCriacaoLobbyBtn" style="color:orange" type="button">Forçar Criação da Lobby</button>'
    );
    document.getElementById( 'forcarCriacaoLobbyBtn' ).addEventListener( 'click', function () {
      intervalCriarLobby = intervalerCriacaoLobby();
      adicionarBotaoCancelarCriarLobby();
    } );
  }
}

function adicionarBotaoCancelarCriarLobby() {
  $( '#lobbyContent > div.row.lobby-rooms-content > div > div > div:nth-child(3)' ).html(
    `<span style="color:orange">FORÇANDO CRIAÇÃO DA LOBBY...</span>
      <button id="cancelarCriacaoLobbyBtn" style="color:red" type="button">Cancelar</button>`
  );
  document.getElementById( 'cancelarCriacaoLobbyBtn' ).addEventListener( 'click', function () {
    clearInterval( intervalCriarLobby );
    adicionarBotaoForcarCriarLobby();
  } );
}

//Criar lobby: https://github.com/LouisRiverstone/gamersclub-lobby_waiter/ com as modificações por causa do layout novo
function intervalerCriacaoLobby() {
  return setInterval( async () => {
    if ( !$( '.sidebar-titulo.sidebar-sala-titulo' ).text().length ) {
      const lobbies = $( '.LobbiesInfo__expanded > .Tag > .Tag__tagLabel' )[0].innerText.split( '/' )[1];
      const windowVars = retrieveWindowVariables( [ 'LOBBIES_LIMIT' ] );
      const limiteLobby = windowVars.LOBBIES_LIMIT;
      if ( Number( lobbies ) < Number( limiteLobby ) ) {
        //Criar lobby por meio de requisição com AXIOS. ozKcs
        chrome.storage.sync.get( [ 'preVetos', 'lobbyPrivada' ], async res => {
          const preVetos = res.preVetos ? res.preVetos : [];
          const lobbyPrivada = res.lobbyPrivada ? res.lobbyPrivada : false;
          const postData = {
            max_level_to_join: 20,
            min_level_to_join: 0,
            private: lobbyPrivada,
            region: 0,
            restriction: 1,
            team: null,
            team_players: [],
            type: 'newRoom',
            vetoes: preVetos
          };
          const criarPost = await axios.post( '/lobbyBeta/createLobby', postData );
          if ( criarPost.data.success ) {
            const loadLobby = await axios.post( '/lobbyBeta/openRoom' );
            if ( loadLobby.data.success ) {
              location.href = 'javascript:openLobby(); void 0';
              setTimeout( async () => {
                //Lobby criada com sucesso e entrado na janela da lobby já
                adicionarBotaoForcarCriarLobby();
                clearInterval( intervalCriarLobby );
              }, 1000 );
            }
          } else {
            if ( criarPost.data.message.includes( 'Anti-cheat' ) || criarPost.data.message.includes( 'banned' ) ) {
              clearInterval( intervalCriarLobby );
              adicionarBotaoForcarCriarLobby();
              location.href = `javascript:errorAlert('${criarPost.data.message}'); void 0`;
              return;
            }
          }
        } );
      }
    } else {
      adicionarBotaoForcarCriarLobby();
      clearInterval( intervalCriarLobby );
    }
  }, 500 );
}

