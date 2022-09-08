import { adicionarNaLista, removerDaLista } from '../../lib/blockList';
import { getAllStorageSyncData, getTranslationText } from '../../utils';
import { alertaMsg } from '../../lib/messageAlerts';

export function initListaBloqueio() {
  chrome.storage.sync.get( [ 'blockList' ], function ( result ) {
    if ( !result.blockList ) {
      chrome.storage.sync.set( { blockList: [] }, initBotaoListaBloqueio );
    } else {
      initBotaoListaBloqueio();
    }
  } );
}

async function initBotaoListaBloqueio() {
  const { traducao } = await getAllStorageSyncData();
  const addBlocklistText = getTranslationText( 'adicionar-a-lista-de-bloqueio', traducao );
  const removeBlocklistText = getTranslationText( 'remover-da-lista-de-bloqueio', traducao );
  const addedBlocklistText = getTranslationText( 'foi-adicionado-a-lista-bloqueio', traducao );
  const removedBlocklistText = getTranslationText( 'foi-removido-da-lista-bloqueio', traducao );
  const seuNickReal = document.getElementsByClassName( 'MainHeader__playerNickname' )[0].innerText;

  //Quando iniciar, adicionar os botoes da lista de bloqueio
  const playerSelector = $( '.tableMatch__leftColumn' );
  for ( let i = 0; i < playerSelector.length; i++ ) {
    if ( playerSelector[i].outerText === seuNickReal ) { continue; }
    const botaoHTML = $( `<button data="preAlready" class="botaoListaDeBloqueio">${addBlocklistText}</button>` );
    botaoHTML.insertAfter( playerSelector[i] );
  }
  //Verificar quais já estão marcados
  chrome.storage.sync.get( [ 'blockList' ], function ( result ) {
    if ( result.blockList ) {
      const botaoLista = document.getElementsByClassName( 'botaoListaDeBloqueio' );
      for ( let i = 0; i < botaoLista.length; i++ ) {
        //Verificar se já existe no array
        const id = botaoLista[i].offsetParent.children[0].children[0].children[2].href.replace( 'https://gamersclub.com.br/jogador/', '' );
        const avatarURL = botaoLista[i].offsetParent.children[0].children[0].children[0].children[1].currentSrc;

        const listaDeTodosOsIDs = result.blockList.map( e => { return e.id; } );
        if ( listaDeTodosOsIDs.includes( id ) ) {
          botaoLista[i].innerText = removeBlocklistText;
          botaoLista[i].setAttribute( 'data', 'alreadyListed' );
        } else {
          botaoLista[i].innerText = addBlocklistText;
          botaoLista[i].setAttribute( 'data', 'notAlreadyListed' );
        }
        //Adicionar o listener de clique
        botaoLista[i].addEventListener( 'click', function ( click ) {
          const state = botaoLista[i].attributes[0].value;

          if ( state === 'alreadyListed' ) {
            //Remover da lista
            removerDaLista( { id, avatarURL }, function ( ) {
              const nickName = click.path[1].outerText.split( '\n' )[0];
              botaoLista[i].innerText = addBlocklistText;
              botaoLista[i].setAttribute( 'data', 'notAlreadyListed' );
              alertaMsg( `${nickName} ${removedBlocklistText}.` );
            } );
          } else {
            //Adicionar a lista
            adicionarNaLista( { id, avatarURL }, function ( ) {
              const nickName = click.path[1].outerText.split( '\n' )[0];
              botaoLista[i].innerText = removeBlocklistText;
              botaoLista[i].setAttribute( 'data', 'alreadyListed' );
              alertaMsg( `${nickName} ${addedBlocklistText}.` );
            } );
          }
        } );
      }
    }
  } );
}
