import { retrieveWindowVariables } from '../../lib/dom';
import { sendLobby, sendMatchInfo } from '../../lib/discord';
import axios from 'axios';

// let opcoes = {};
chrome.storage.sync.get( null, function ( _result ) {
  // opcoes = result;
  if ( window.location.pathname.includes( 'partida' ) ) {
    initLobbyPartida();
  } else {
    initLobby();
  }
} );

let intervalCriarLobby = null;

const initLobbyPartida = async () => {
  //Helpers
  function atualizarArray( valor, antigo ) {
    const novo = new Array( valor );
    for ( let i = 0; i < antigo.length; ++i ) {
      novo.push( antigo[i] );
    }
    return novo;
  }
  function removerID( arr, value ) {
    return arr.filter( function ( ele ) {
      return ele.id !== value.id;
    } );
  }
  //Antes de inciiar, preparar o array do banco de dados
  chrome.storage.sync.get( [ 'listaNegra' ], async function ( result ) {
    if ( !result.listaNegra ) {
      chrome.storage.sync.set( { listaNegra: [] }, async function ( ) { await initDarkListButton( ); } );
    } else {
      await initDarkListButton();
    }
  } );

  async function initDarkListButton() {
  //Quando iniciar, adicionar os botoes da lista negra
    const playerSelector = $( '.tableMatch__leftColumn' );
    for ( let i = 0; i < playerSelector.length; i++ ) {
      const botaoHTML = $( '<button data="preAlready" class="botaoListaNegra">Adicionar a lista de bloqueio</button>' );
      botaoHTML.insertAfter( playerSelector[i] );
    }
    //Verificar quais já estão marcados
    chrome.storage.sync.get( [ 'listaNegra' ], function ( result ) {
      if ( result.listaNegra ) {
        const botaoListaNegra = document.getElementsByClassName( 'botaoListaNegra' );
        for ( let i = 0; i < botaoListaNegra.length; i++ ) {
          //Verificar se é você
          const userNick = document.getElementsByClassName( 'MainHeader__playerNickname' )[0].innerText;
          const nick = botaoListaNegra[i].offsetParent.children[0].children[0].children[2].innerText;
          //Verificar se já existe no array
          const id = botaoListaNegra[i].offsetParent.children[0].children[0].children[2].href.replace( 'https://gamersclub.com.br/jogador/', '' );
          const avatarURL = botaoListaNegra[i].offsetParent.children[0].children[0].children[0].children[1].currentSrc;

          const ids = result.listaNegra.map( e => { return e.id; } );
          if ( ids.includes( id ) ) {
            botaoListaNegra[i].innerText = 'Remover da lista de bloqueio';
            botaoListaNegra[i].setAttribute( 'data', 'alreadyListed' );
          } else {
            botaoListaNegra[i].innerText = 'Adicionar a lista de bloqueio';
            botaoListaNegra[i].setAttribute( 'data', 'notAlreadyListed' );
          }
          //Adicionar o listener de clique
          botaoListaNegra[i].addEventListener( 'click', function ( click ) {
            const prefix = '[ Lista de Bloqueio ]';
            const prefixRed = `<a style='color: yellow;'>${prefix}</a>`;
            const state = botaoListaNegra[i].attributes[0].value;

            if ( state === 'alreadyListed' ) {
              //Remover da lista
              chrome.storage.sync.get( [ 'listaNegra' ], function ( result ) {
                if ( result['listaNegra'] ) {
                  const array = result['listaNegra'] ? result['listaNegra'] : [];
                  const obj = { id, nick, avatarURL };
                  const arrayNovo = array.find( e => e.id === id ) ? removerID( array, obj ) : array;
                  const listaObj = {};
                  listaObj['listaNegra'] = arrayNovo;
                  chrome.storage.sync.set( listaObj, function ( ) {
                    const nickName = `<a style='color: yellow;'>${click.path[1].outerText.split( '\n' )[0]}</a>`;
                    botaoListaNegra[i].innerText = 'Adicionar a lista de bloqueio';
                    botaoListaNegra[i].setAttribute( 'data', 'notAlreadyListed' );
                    alertaMsg( prefixRed + ' - Removido o(a) ' + nickName + ' da lista negra.' );
                  } );
                }
              } );
            } else {
              //Adicionar a lista
              chrome.storage.sync.get( [ 'listaNegra' ], function ( result ) {
                if ( result['listaNegra'] ) {
                  const array = result['listaNegra'] ? result['listaNegra'] : [];
                  const obj = { id, nick, avatarURL };
                  const arrayNovo = array.find( e => e.id === id ) ? array : atualizarArray( obj, array );
                  const listaObj = {};
                  listaObj['listaNegra'] = arrayNovo;
                  chrome.storage.sync.set( listaObj, function ( ) {
                    const nickName = `<a style='color: yellow;'>${click.path[1].outerText.split( '\n' )[0]}</a>`;
                    botaoListaNegra[i].innerText = 'Remover da lista de bloqueio';
                    botaoListaNegra[i].setAttribute( 'data', 'alreadyListed' );
                    alertaMsg( prefixRed + ' - Adicionado o(a) ' + nickName + ' na lista negra.' );
                  } );
                }
              } );
            }
          } );
          if ( nick === userNick ) {
            botaoListaNegra[i].parentNode.removeChild( botaoListaNegra[i] );
          }
        }
      }
    } );
  }
};

const initLobby = async () => {
  // const copiarIpFunc = mutations =>
  //   chrome.storage.sync.get( [ 'autoCopiarIp' ], function ( result ) {
  //     if ( result.autoCopiarIp ) {
  //       $.each( mutations, async ( i, mutation ) => {
  //         const addedNodes = $( mutation.addedNodes );
  //         const selector = '#gameModalCopyServer';
  //         const ipInput = addedNodes.find( selector ).addBack( selector );
  //         if ( ipInput && ipInput.length ) {
  //           ipInput[0].click();
  //         }
  //       } );
  //     }
  //   } );
  // criarObserver( '#rankedModals', copiarIpFunc );

  const somReadyFunc = mutations =>
    chrome.storage.sync.get( [ 'somReady', 'customSomReady', 'volume' ], function ( result ) {
      if ( result.somReady ) {
        $.each( mutations, ( _i, mutation ) => {
          const addedNodes = $( mutation.addedNodes );
          const selector = 'button:contains(\'Ready\')';
          const readyButton = addedNodes.find( selector ).addBack( selector );
          if ( readyButton && readyButton.length && readyButton.text() === 'Ready' && !readyButton.disabled ) {
            const som = result.somReady === 'custom' ? result.customSomReady : result.somReady;
            const audio = new Audio( som );
            const volume = result.volume || 100;
            audio.volume = volume / 100;
            $( selector ).on( 'click', function () { audio.play(); } );
          }
        } );
      }
    } );
  criarObserver( '.lobby,.ranking', somReadyFunc );

  const autoAceitarReadyFunc = mutations =>
    chrome.storage.sync.get( [ 'autoAceitarReady' ], function ( result ) {
      if ( result.autoAceitarReady ) {
        $.each( mutations, ( i, mutation ) => {
          const addedNodes = $( mutation.addedNodes );
          //eslint-disable-next-line
          const selector = "button:contains('Ready')";
          const readyButton = addedNodes.find( selector ).addBack( selector );
          if ( readyButton && readyButton.length && !readyButton.disabled ) {
            setTimeout( () => {
              readyButton[0].click();
              readyButton[0].trigger( 'click' );
            }, 150 );
          }
        } );
      }
    } );
  criarObserver( '.lobby,.ranking', autoAceitarReadyFunc );

  // Clicar automáticamente no Ready, temporário.
  setInterval( async () => {
    chrome.storage.sync.get( [ 'autoAceitarReady' ], function ( result ) {
      if ( result.autoAceitarReady ) {
        // eslint-disable-next-line
        const readyButton = $( "button:contains('Ready')" );
        if ( readyButton.length ) {
          setTimeout( () => {
            readyButton[0].click();
            readyButton[0].trigger( 'click' );
          }, 150 );
        }
      }
    } );
  }, 300 );

  const autoFixarMenuLobbyFunc = mutations =>
    chrome.storage.sync.get( [ 'autoFixarMenuLobby' ], function ( result ) {
      if ( result.autoFixarMenuLobby ) {
        const windowVariables = retrieveWindowVariables( [ 'ISSUBSCRIBER' ] );
        const isSubscriber = windowVariables.ISSUBSCRIBER;
        mutations.forEach( mutation => {
          if ( !mutation.addedNodes ) { return; }

          for ( let i = 0; i < mutation.addedNodes.length; i++ ) {
            const node = mutation.addedNodes[i];
            if ( typeof node.id !== 'undefined' ) {
              if ( node.id.includes( 'SidebarSala' ) ) {
                if ( !isSubscriber ) {
                  $( node ).css( {
                    position: 'fixed',
                    top: '130px',
                    bottom: 'auto'
                  } );
                } else {
                  $( node ).css( {
                    position: 'fixed',
                    top: '10%',
                    bottom: 'auto'
                  } );
                }
              }
              if ( node.className.includes( 'sidebar-desafios sidebar-content' ) ) {
                if ( !isSubscriber ) {
                  $( node ).css( {
                    position: 'fixed',
                    top: '130px',
                    right: '72px',
                    bottom: 'auto'
                  } );
                } else {
                  $( node ).css( {
                    position: 'fixed',
                    top: '10%',
                    right: '72px',
                    bottom: 'auto'
                  } );
                }
              }
            }
          }
        } );
      }
    } );
  criarObserver( '#lobbyContent', autoFixarMenuLobbyFunc );

  const autoConcordarTermosRankedFunc = mutations =>
    chrome.storage.sync.get( [ 'autoConcordarTermosRanked' ], function ( result ) {
      if ( result.autoConcordarTermosRanked ) {
        $.each( mutations, ( i, mutation ) => {
          const addedNodes = $( mutation.addedNodes );
          const selector = '.RankedRules__button';
          const concordarButton = addedNodes.find( selector ).addBack( selector );
          if ( concordarButton && concordarButton.length ) {
            concordarButton[0].click();
          }
        } );
      }
    } );
  criarObserver( '.lobby,.ranking', autoConcordarTermosRankedFunc );


  const partidaInfoFunc = mutations => {
    chrome.storage.sync.get( [ 'webhookLink', 'enviarPartida' ], function ( result ) {
      if ( result.webhookLink && result.webhookLink.length > 0 ) {
        $.each( mutations, async ( _i, mutation ) => {
          const addedNodes = $( mutation.addedNodes );
          const selector = '.CopyButton-sc-1ylcea4-3';
          const ipInput = addedNodes.find( selector ).addBack( selector );
          if ( ipInput ) {
            if ( document.getElementById( 'botaoDiscordnoDOM' ) ) {
              return false;
            } else {
              const listenGame = await axios.get( '/api/lobby/match' );
              if ( listenGame.data.data.step === 'onServerReady' ) {
                $( '.Container-sc-1ylcea4-0' )
                  .parent()
                  .append(
                    `<button id="botaoDiscordnoDOM" class="WasdButton WasdButton--success WasdButton--lg botaoDiscordnoDOM-sc-1ylcea4-4"
                  data-tip-text="Clique para enviar no discord">Enviar no Discord</button>`
                  );
                document.getElementById( 'botaoDiscordnoDOM' ).addEventListener( 'click', async function () {
                  await sendMatchInfo( result.webhookLink, listenGame.data.data );
                } );
                if ( result.enviarPartida ) {
                  await sendMatchInfo( result.webhookLink, listenGame.data.data );
                }
              }
            }
          }
        } );
      }
    } );
  };
  criarObserver( '#matchMainContainer', partidaInfoFunc );

  const lobbyLinkFunc = mutations =>
    chrome.storage.sync.get( [ 'webhookLink', 'enviarLinkLobby' ], function ( result ) {
      if ( result.webhookLink && result.webhookLink.length > 0 ) {
        mutations.forEach( async mutation => {
          if ( !mutation.addedNodes ) {
            return;
          }
          for ( let i = 0; i < mutation.addedNodes.length; i++ ) {
            const node = mutation.addedNodes[i];
            if (
              node.nextElementSibling &&
              node.nextElementSibling.className &&
              node.nextElementSibling.className.includes( 'sidebar-desafios sidebar-content' )
            ) {
              if ( result.webhookLink.startsWith( 'http' ) ) {
                if ( document.getElementById( 'discordLobbyButton' ) ) {
                  return false;
                } else {
                  if ( result.enviarLinkLobby ) {
                    const lobbyInfo = await axios.post( '/lobbyBeta/openRoom' );
                    await sendLobby( result.webhookLink, lobbyInfo.data );
                    alertaMsg( '[Discord] - Enviado com sucesso' );
                  }
                  if ( $( '.btn-radial.btn-blue.btn-copiar-link' ).length === 0 ) {
                    return false;
                  }
                  document
                    .getElementsByClassName( 'sidebar-titulo sidebar-sala-titulo' )[0]
                    .setAttribute( 'style', 'font-size: 12px;' );
                  $( '.btn-radial.btn-blue.btn-copiar-link' )
                    .parent()
                    .append(
                      `<span class="btn-radial btn-blue btn-copiar-link" id="discordLobbyButton"
                         title="Enviar lobby Discord" data-jsaction="gcCommonTooltip" data-tip-text="Convidar Amigos">
                           <img src="https:img.icons8.com/material-sharp/18/ffffff/discord-logo.png"/>
                       </span>`
                    );

                  document.getElementById( 'discordLobbyButton' ).addEventListener( 'click', async function () {
                    const lobbyInfo = await axios.post( '/lobbyBeta/openRoom' );
                    await sendLobby( result.webhookLink, lobbyInfo.data );
                    alertaMsg( '[Discord] - Enviado com sucesso' );
                  } );
                }
              }
            }
          }
        } );
      }
    } );
  criarObserver( '#lobbyContent', lobbyLinkFunc );

  const listaNegraFunc = mutations =>
    chrome.storage.sync.get( [ 'listaNegra' ], function ( ) {
      const prefix = '[ Lista de Bloqueio ] - ';
      const prefixRed = `<a style='color: yellow;'>${prefix}</a>`;
      mutations.forEach( async mutation => {
        if ( !mutation.addedNodes ) {
          return;
        }
        for ( let i = 0; i < mutation.addedNodes.length; i++ ) {
          const node = mutation.addedNodes[i];
          if ( node.className && node.className.includes( 'sidebar-item' ) ) {
            chrome.storage.sync.get( [ 'listaNegra' ], function ( res ) {
              if ( res.listaNegra ) {
                const id = node.querySelector( 'a' ).getAttribute( 'href' ).replace( '/jogador/', '' );
                const nick = node.querySelector( 'a' ).getAttribute( 'title' ).split( ' | ' )[0];
                console.log( 'Entrou o ID ' + id + ' nick: ' + nick );
                if ( res.listaNegra.includes( id ) ) {
                  console.log( 'Entrou uma pessoa da sua lista negra com o id ' + id + ' nick: ' + nick );
                  alertaMsg( prefixRed + ': Essa pessoa: ' + nick + ' está na sua lista de bloqueio' );
                }
              }
            } );
          }
        }
      } );
    } );
  criarObserver( '#lobbyContent', listaNegraFunc );
  //Feature pra criar lobby caso full
  adicionarBotaoForcarCriarLobby();
};

function alertaMsg( msg ) {
  const cfgNoty = {
    'text': msg,
    'layout': 'center',
    'theme': 'relax',
    'dismissQueue': true,
    'timeout': 5000,
    'type': 'success',
    'animation': {
      'open': 'animated bounceInRight',
      'close': 'animated bounceOutRight'
    }
  };
  const cfgNotyStr = JSON.stringify( cfgNoty );
  const jqueryString = '$("#noty_center_layout_container").css("z-index",99999999999)';
  const stringToPass = 'javascript:function successAlert(msg){ noty(' + cfgNotyStr + ');' + jqueryString + ';};successAlert("' + msg + '"); void 0';
  location.href = stringToPass;
}

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

function adicionarBotaoForcarCriarLobby() {
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
