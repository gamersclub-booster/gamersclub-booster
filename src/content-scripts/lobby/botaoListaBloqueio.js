import { adicionarNaLista, removerDaLista, alertaMsg } from '../../lib/blockList';

export async function initListaBloqueio() {
  chrome.storage.sync.get( [ 'blockList' ], async function ( result ) {
    if ( !result.blockList ) {
      chrome.storage.sync.set( { blockList: [] }, async function ( ) { await initBotaoListaBloqueio( ); } );
    } else {
      await initBotaoListaBloqueio();
    }
  } );
}

async function initBotaoListaBloqueio() {
  //Quando iniciar, adicionar os botoes da lista de bloqueio
  const playerSelector = $( '.tableMatch__leftColumn' );
  for ( let i = 0; i < playerSelector.length; i++ ) {
    const botaoHTML = $( '<button data="preAlready" class="botaoListaDeBloqueio">Adicionar a lista de bloqueio</button>' );
    botaoHTML.insertAfter( playerSelector[i] );
  }
  //Verificar quais já estão marcados
  chrome.storage.sync.get( [ 'blockList' ], function ( result ) {
    if ( result.blockList ) {
      const botaoLista = document.getElementsByClassName( 'botaoListaDeBloqueio' );
      for ( let i = 0; i < botaoLista.length; i++ ) {
        //Verificar se já existe no array
        const nick = botaoLista[i].offsetParent.children[0].children[0].children[2].innerText;
        const id = botaoLista[i].offsetParent.children[0].children[0].children[2].href.replace( 'https://gamersclub.com.br/jogador/', '' );
        const avatarURL = botaoLista[i].offsetParent.children[0].children[0].children[0].children[1].currentSrc;

        const listaDeTodosOsIDs = result.blockList.map( e => { return e.id; } );
        if ( listaDeTodosOsIDs.includes( id ) ) {
          botaoLista[i].innerText = 'Remover da lista de bloqueio';
          botaoLista[i].setAttribute( 'data', 'alreadyListed' );
        } else {
          botaoLista[i].innerText = 'Adicionar a lista de bloqueio';
          botaoLista[i].setAttribute( 'data', 'notAlreadyListed' );
        }
        //Adicionar o listener de clique
        botaoLista[i].addEventListener( 'click', function ( click ) {
          const prefix = '<a style="color: yellow;">[ Lista de Bloqueio ]</a>';
          const state = botaoLista[i].attributes[0].value;

          if ( state === 'alreadyListed' ) {
            //Remover da lista
            removerDaLista( { id, nick, avatarURL }, function ( ) {
              const nickName = `<a style='color: yellow;'>${click.path[1].outerText.split( '\n' )[0]}</a>`;
              botaoLista[i].innerText = 'Adicionar a lista de bloqueio';
              botaoLista[i].setAttribute( 'data', 'notAlreadyListed' );
              alertaMsg( prefix + ' - Removido o(a) ' + nickName + ' na sua lista de bloqueio.' );
            } );
          } else {
            //Adicionar a lista
            adicionarNaLista( { id, nick, avatarURL }, function ( ) {
              const nickName = `<a style='color: yellow;'>${click.path[1].outerText.split( '\n' )[0]}</a>`;
              botaoLista[i].innerText = 'Remover da lista de bloqueio';
              botaoLista[i].setAttribute( 'data', 'alreadyListed' );
              alertaMsg( prefix + ' - Adicionado o(a) ' + nickName + ' na sua lista de bloqueio.' );
            } );
          }
        } );
        const seuNickReal = document.getElementsByClassName( 'MainHeader__playerNickname' )[0].innerText;
        if ( nick === seuNickReal ) {
          botaoLista[i].parentNode.removeChild( botaoLista[i] );
        }
      }
    }
  } );
}
