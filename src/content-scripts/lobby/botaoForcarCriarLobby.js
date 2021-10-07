import { retrieveWindowVariables } from '../../lib/dom';
import { GC_URL, isFirefox } from '../../lib/constants';
import { alertaMsg } from '../../lib/messageAlerts';
import axios from 'axios';

let intervalCriarLobby = null;

export function adicionarBotaoForcarCriarLobby() {
  if ( !$( '#criarLobbyBtn' ).length ) {
    $( '#gcbooster_botoes' ).append(
      $( '<button/>', {
        'id': 'criarLobbyBtn',
        'class': 'WasdButton',
        'css': { 'background-color': 'orange', 'border-radius': '4px' },
        'type': 'button',
        'text': 'Criar Lobby Pre Configurada'
      } )
    );
    addListeners();
  } else {
    $( '#criarLobbyBtn' )
      .css( { 'background-color': 'orange', 'border-radius': '4px' } )
      .text( 'Criar Lobby Pre Configurada' )
      .removeClass( 'Cancelar' );
  }
}

function adicionarBotaoCancelarCriarLobby() {
  $( '#criarLobbyBtn' )
    .css( { 'background-color': 'red', 'border-radius': '4px' } )
    .text( 'Cancelar Criação...' )
    .addClass( 'Cancelar' );
}

function addListeners() {
  $( '#criarLobbyBtn' ).on( 'click', function () {
    if ( $( '#criarLobbyBtn' ).hasClass( 'Cancelar' ) ) {
      clearInterval( intervalCriarLobby );
      adicionarBotaoForcarCriarLobby();
    } else {
      intervalCriarLobby = intervalerCriacaoLobby();
      adicionarBotaoCancelarCriarLobby();
    }
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
          const criarPost = await axios.post( `https://${ GC_URL }/lobbyBeta/createLobby`, postData );
          if ( criarPost.data.success ) {
            const loadLobby = await axios.post( `https://${ GC_URL }/lobbyBeta/openRoom` );
            if ( loadLobby.data.success ) {
              if ( isFirefox ) {
                window.wrappedJSObject.openLobby();
              } else {
                location.href = 'javascript:openLobby(); void 0';
              }
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
              alertaMsg( criarPost.data.message );
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

