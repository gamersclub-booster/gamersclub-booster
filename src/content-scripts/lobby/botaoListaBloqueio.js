import { adicionarNaLista, removerDaLista } from '../../lib/blockList';
import { getAllStorageSyncData, getTranslationText, waitForElement } from '../../utils';
import { alertaMsg } from '../../lib/messageAlerts';
import { getUserInfo } from '../../lib/dom';

export async function initListaBloqueio() {
  // aguarda as tabelas carregarem antes de adicionar os botões
  await waitForElement( '.tableMatch__leftColumn' );

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
  const { plID: playerId } = getUserInfo();
  //Quando iniciar, adicionar os botoes da lista de bloqueio
  const playerSelector = $( '.tableMatch__leftColumn' );
  for ( let i = 0; i < playerSelector.length; i++ ) {
    // Para não adicionar você mesmo na lista
    const Iam = $( playerSelector[i] ).find( '.tableMatch__playerLink ' ).attr( 'href' );
    if ( Iam.includes( playerId ) ) { continue; }

    const botaoHTML = $( `<button data="preAlready" class="botaoListaDeBloqueio">${addBlocklistText}</button>` );
    botaoHTML.insertAfter( playerSelector[i] );
  }
  //Verificar quais já estão marcados
  chrome.storage.sync.get( [ 'blockList' ], function ( result ) {
    if ( result.blockList ) {
      const botaoLista = document.getElementsByClassName( 'botaoListaDeBloqueio' );
      for ( let i = 0; i < botaoLista.length; i++ ) {
        //Verificar se já existe no array
        const itemList = $( botaoLista[i] ).parents( '.tableMatch__nickColumn' );
        const id = itemList.find( '.tableMatch__playerLink ' ).attr( 'href' );
        const avatarURL = itemList.find( '.gc-avatar-image' ).attr( 'src' );

        const listaDeTodosOsIDs = result.blockList.map( e => { return e.id; } );
        if ( listaDeTodosOsIDs.includes( id ) ) {
          botaoLista[i].innerText = removeBlocklistText;
          botaoLista[i].setAttribute( 'data', 'alreadyListed' );
        } else {
          botaoLista[i].innerText = addBlocklistText;
          botaoLista[i].setAttribute( 'data', 'notAlreadyListed' );
        }
        //Adicionar o listener de clique
        // $( botaoLista[i] ).on( 'click', function ( click ) {
        botaoLista[i].addEventListener( 'click', function ( click ) {
          click.stopPropagation();
          const clickButton = $( this );
          const state = botaoLista[i].attributes[0].value;
          const nick = clickButton.parents( '.tableMatch__nickColumn' ).find( '.tableMatch__playerLink ' ).text();
          if ( state === 'alreadyListed' ) {
            //Remover da lista
            removerDaLista( { id, avatarURL, nick }, function ( ) {
              botaoLista[i].innerText = addBlocklistText;
              botaoLista[i].setAttribute( 'data', 'notAlreadyListed' );
              alertaMsg( `${nick} ${removedBlocklistText}.` );
            } );
          } else {
            //Adicionar a lista
            adicionarNaLista( { id, avatarURL, nick }, function ( ) {
              botaoLista[i].innerText = removeBlocklistText;
              botaoLista[i].setAttribute( 'data', 'alreadyListed' );
              alertaMsg( `${nick} ${addedBlocklistText}.` );
            } );
          }
        } );
      }
    }
  } );
}
