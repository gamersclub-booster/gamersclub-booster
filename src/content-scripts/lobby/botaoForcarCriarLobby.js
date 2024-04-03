// @TODO: cleanup e ativar? não ta sendo usado.
import { GC_URL, isFirefox } from '../../lib/constants';
import { alertaMsg } from '../../lib/messageAlerts';
import axios from 'axios';
import { getAllStorageSyncData, getTranslationText } from '../../utils';

let intervalCriarLobby = null;

export async function adicionarBotaoForcarCriarLobby() {
  const { traducao } = await getAllStorageSyncData();
  const text = getTranslationText( 'criar-lobby-pre-configurada', traducao );

  if ( !$( '#criarLobbyBtn' ).length ) {
    setTimeout( () => {
      $( '#lobby-actions-create-lobby-button' ).parent().append(
        $( '<button/>', {
          'id': 'criarLobbyBtn',
          'class': 'WasdButton WasdButton--success WasdButton--lg WasdButton--block draw-orange',
          'type': 'button',
          'text': text
        } )
      );
      addListeners();
    }, 5000 );
  } else {
    $( '#criarLobbyBtn' )
      .css( { 'background-color': '#839800', 'border-radius': '4px' } )
      .text( text )
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
      const windowVars = 0; //retrieveWindowVariables( [ 'LOBBIES_LIMIT' ] ); // Não funciona mais.
      const limiteLobby = windowVars.LOBBIES_LIMIT;
      if ( Number( lobbies ) < Number( limiteLobby ) ) {
        //Criar lobby por meio de requisição com AXIOS. ozKcs
        chrome.storage.sync.get( [ 'preVetos', 'lobbyPrivada', 'jogarCom' ], async res => {
          const preVetos = res.preVetos ? res.preVetos : [];
          const lobbyPrivada = res.lobbyPrivada ? res.lobbyPrivada : false;
          const jogarCom = res.jogarCom ? res.jogarCom : 0;
          const postData = {
            max_level_to_join: 21,
            min_level_to_join: 0,
            private: lobbyPrivada,
            region: 0,
            restriction: jogarCom,
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

