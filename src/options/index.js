import { features, preVetosMapas, configValues, paginas, audios } from '../lib/constants';
import { saveJson, loadJson } from '../lib/blockList';
import { removerDaLista } from '../lib/blockList';
import { testWebhook } from '../lib/discord';
import manifest from '../../manifest.json';
import pt from '../translations/pt.json';
import en from '../translations/en.json';
import es from '../translations/es.json';

const translations = {
  'pt': pt,
  'en': en,
  'es': es
};

function iniciarPaginaOpcoes() {
  limparOpcoesInvalidas();
  adicionaVersao();
  marcarCheckboxes();
  marcarPreVetos();
  adicionarListenersFeatures();
  adicionarListenersPaginas();
  adicionarListenerPreVetos();
  popularAudioOptions();
  selecionarSons();
  adicionarListenersSons();
  loadWebhook();
  adicionarListenerTraducao();
  loadBlockList();
  listenerButtonBlockList();
}
function limparOpcoesInvalidas() {
  chrome.storage.sync.get( [ 'preVetos' ], res => {
    if ( res.preVetos && res.preVetos.length > 0 ) {
      const index = res.preVetos.indexOf( 11 );
      if ( index > -1 ) {
        const mapas = res.preVetos;
        mapas.splice( index, 1 );
        chrome.storage.sync.set( { preVetos: mapas } );
      }
    }
  } );
}
function adicionarListenerTraducao() {
  Object.keys( translations ).forEach( lang => {
    document.getElementById( `traducao-${lang}` ).addEventListener( 'click', function () {
      chrome.storage.sync.set( { traducao: lang } );
      carregarTraducao( lang );
      Array.from( document.getElementsByClassName( 'translate-active' ) ).forEach( el => {
        el.classList.remove( 'translate-active' );
      } );
      this.classList.add( 'translate-active' );
    } );
  } );
}
document.addEventListener( 'DOMContentLoaded', () => {
  chrome.storage.sync.get( [ 'traducao' ], response => {
    const lang = ( response.traducao || navigator.language || 'pt' ).slice( 0, 2 );
    carregarTraducao( lang );
    document.getElementById( `traducao-${lang}` ).classList.add( 'translate-active' );
  } );

} );
function carregarTraducao( language = 'pt' ) {
  const translation = translations[language];
  const translateArray = document.querySelectorAll( '[translation-key]' );
  translateArray.forEach( element => {
    const key = element.getAttribute( 'translation-key' );
    const attr = element.getAttribute( 'translation-attr' ) || 'innerHTML';
    const text = translation[key];
    if ( text ) {
      element[attr] = text;
    }
  } );
}
function popularAudioOptions() {
  for ( const selectId of [ 'somReady' ] ) {
    const select = document.getElementById( selectId );
    for ( const index in audios ) {
      select.options[select.options.length] = new Option( audios[index], index );
    }
  }
}

function adicionaVersao() {
  Array.from( document.getElementsByClassName( 'versao' ) ).forEach( v => {
    v.textContent = manifest.version;
  } );
}

function marcarPreVetos() {
  chrome.storage.sync.get( [ 'preVetos' ], response => {
    if ( !response.preVetos ) { return false; }
    for ( let i = 0; i < response.preVetos.length; i++ ) {
      const codigo = response.preVetos[i];
      const mapaNome = preVetosMapas.filter( e => {
        return e.codigo === codigo;
      } )[0].mapa;
      document.getElementById( 'preVeto' + mapaNome ).checked = true;
    }
  } );
}

function marcarCheckboxes() {
  chrome.storage.sync.get( null, response => {
    if ( !response ) { return false; }
    for ( const feature of features ) {
      document.getElementById( feature ).checked = response[feature];
    }
  } );
}

function adicionarListenerPreVetos() {
  for ( const mapa of preVetosMapas ) {
    const idSelector = 'preVeto' + mapa.mapa;

    document.getElementById( idSelector ).addEventListener( 'change', function () {
      const codigo = document.getElementById( idSelector ).getAttribute( 'codigo' );
      chrome.storage.sync.get( [ 'preVetos' ], res => {
        const preVetos = res.preVetos;
        if ( this.checked ) {
          //adicionar
          if ( preVetos === undefined ) {
            //Primeira vez add um pre veto
            chrome.storage.sync.set( { preVetos: [ Number( codigo ) ] } );
          } else if ( preVetos.length > 2 ) {
            //Ja possui 3 pre vetos
            document.getElementById( 'prevetoTitle' ).innerText = 'Erro! Máximo 3 mapas';
            setTimeout( function () {
              document.getElementById( 'prevetoTitle' ).innerText = 'Pré Vetos (3 escolhas)';
            }, 2 * 1000 );
            document.getElementById( idSelector ).checked = false;
            return false;
          } else if ( preVetos.length <= 2 ) {
            //Menor ou igual a 2 vetos = adicionar
            chrome.storage.sync.get( [ 'preVetos' ], res => {
              const preVetosAntes = res.preVetos;
              preVetosAntes.push( Number( codigo ) );
              chrome.storage.sync.set( { preVetos: preVetosAntes } );
            } );
          }
        } else {
          //desmarquei
          const preVetosAntes = preVetos;
          const preVetosDepois = arrayRemove( preVetosAntes, Number( codigo ) );
          chrome.storage.sync.set( { preVetos: preVetosDepois } );
        }
      } );
    } );
  }
}

function arrayRemove( arr, value ) {
  return arr.filter( function ( ele ) {
    return ele !== value;
  } );
}

function adicionarListenersFeatures() {
  for ( const feature of features ) {
    document.getElementById( feature ).addEventListener( 'change', function () {
      console.log( feature, ' changed' );
      chrome.storage.sync.set( { [feature]: this.checked }, function () {} );
    } );
  }
}

function adicionarListenersPaginas() {
  for ( const pagina of paginas ) {
    document.getElementById( `link-${pagina}` ).addEventListener( 'click', function () {
      abrirPagina( pagina );
    } );
  }
}

function selecionarSons() {
  chrome.storage.sync.get( null, response => {
    if ( !response ) { return false; }
    for ( const config of configValues ) {
      document.getElementById( config ).value = response[config];
    }
  } );
}

function adicionarListenersSons() {
  for ( const config of configValues ) {
    document.getElementById( config ).addEventListener( 'change', function () {
      if ( this.value === 'custom' ) {
        const customObj = document.getElementById( `p-custom${this.id[0].toUpperCase()}${this.id.slice( 1 )}` );
        if ( customObj ) { customObj.style.display = 'block'; }
      } else {
        const customObj = document.getElementById( `p-custom${this.id[0].toUpperCase()}${this.id.slice( 1 )}` );
        if ( customObj ) { customObj.style.display = 'none'; }
      }
      chrome.storage.sync.set( { [config]: this.value }, function () {} );
    } );
  }
  document.getElementById( 'testarSomReady' ).addEventListener( 'click', function () {
    const som =
      document.getElementById( 'somReady' ).value === 'custom' ?
        document.getElementById( 'customSomReady' ).value :
        document.getElementById( 'somReady' ).value;
    const audio = new Audio( som );
    audio.volume = document.getElementById( 'volume' ).value / 100;
    audio.play();
  } );
}

function abrirPagina( pagina ) {
  const link = document.getElementById( `link-${pagina}` );
  const paginaAtiva = document.getElementById( pagina );

  Array.from( document.getElementsByClassName( 'ativo' ) ).forEach( el => {
    el.classList.remove( 'ativo' );
  } );

  Array.from( document.getElementsByClassName( 'active' ) ).forEach( el => {
    el.classList.remove( 'active' );
  } );

  link.classList.add( 'active' );
  paginaAtiva.classList.add( 'ativo' );
}

//Discord

function loadWebhook() {
  chrome.storage.sync.get( [ 'webhookLink' ], function ( data ) {
    if ( data.webhookLink ) {
      document.getElementById( 'campoWebhookLink' ).value = data.webhookLink;
      document.getElementById( 'statusWebhook' ).innerText = 'OK';
      document.getElementById( 'divDoDiscord' ).removeAttribute( 'hidden' );
    } else {
      document.getElementById( 'campoWebhookLink' ).value = '';
      document.getElementById( 'statusWebhook' ).innerText = 'Sem URL salva';
      document.getElementById( 'divDoDiscord' ).setAttribute( 'hidden', true );
    }
  } );
  document.getElementById( 'botaoLimparDiscord' ).addEventListener( 'click', async () => {
    chrome.storage.sync.set( { ['webhookLink']: '', ['enviarLinkLobby']: false, ['enviarPartida']: false } );
    document.getElementById( 'divDoDiscord' ).hidden = true;
    document.getElementById( 'enviarLinkLobby' ).checked = false;
    document.getElementById( 'enviarPartida' ).checked = false;
    document.getElementById( 'campoWebhookLink' ).value = '';
  } );
  document.getElementById( 'testarWebhook' ).addEventListener( 'click', async function () {
    const url = document.getElementById( 'campoWebhookLink' ).value;
    if ( url.length !== 0 ) {
      try {
        await testWebhook( url );
        document.getElementById( 'statusWebhook' ).innerText = 'OK! Salvando a URL';
        chrome.storage.sync.set( { ['statusWebhook']: 'OK', ['webhookLink']: url }, async function () {
          document.getElementById( 'statusWebhook' ).innerText = 'OK';
          document.getElementById( 'divDoDiscord' ).removeAttribute( 'hidden' );
        } );
      } catch ( e ) {
        console.log( e );
        document.getElementById( 'statusWebhook' ).innerText = 'Erro na URL, tente novamente.';
        document.getElementById( 'divDoDiscord' ).setAttribute( 'hidden', true );
        console.log( 'Erro' );
      }
    } else {
      chrome.storage.sync.get( [ 'statusWebhook' ], function ( e ) {
        if ( e.statusWebhook ) {
          document.getElementById( 'statusWebhook' ).innerText = e.statusWebhook;
        } else {
          document.getElementById( 'statusWebhook' ).innerText = 'Sem URL salva';
        }
      } );
    }
  } );
}

//Block List

function listenerButtonBlockList() {
  const buttonImport = document.getElementById( 'importButton' );
  const buttonExport = document.getElementById( 'exportButton' );
  const importOrig = document.getElementById( 'importOrig' );

  buttonImport.addEventListener( 'click', function () {
    importOrig.click();
  } );

  importOrig.addEventListener( 'change', function ( e ) {
    loadJson( e, function ( data ) {
      if ( data ) {
        chrome.storage.sync.set( data, function () {
          buttonImport.innerText = 'Sucesso';
          iniciarPaginaOpcoes();
          document.querySelector( '[href*="#geral"]' ).click();
          setTimeout( () => {
            carregarTraducao();
          }, 3000 );
        } );
      } else {
        buttonImport.innerText = 'Erro';
        setTimeout( () => {
          carregarTraducao();
        }, 3000 );
      }
    } );
  }, false );

  buttonExport.addEventListener( 'click', function () {
    chrome.storage.sync.get( null, function ( result ) {
      const array = result ? result : {};
      if ( array ) {
        saveJson( array );
        buttonExport.innerText = 'Salvo com sucesso!';
        setTimeout( () => {
          carregarTraducao();
        }, 3000 );
      } else {
        buttonExport.innerText = 'Erro ao salvar!';
        setTimeout( () => {
          carregarTraducao();
        }, 3000 );
      }
    } );
  } );
}

function loadBlockList() {
  const blackBlackList = `
  <div>
    <li translation-key="ninguemNaLista"></li>
    <li translation-key="comoAddnaLista"></li>
    <li translation-key="notificacao"></li>
  </div>`;

  chrome.storage.sync.get( [ 'blockList' ], function ( data ) {
    const listHTML = document.getElementById( 'lista' );
    if ( data.blockList ) {
      if ( typeof data.blockList === 'object' && data.blockList.length > 0 ) {
        data.blockList.forEach( each => {
          const { id, avatarURL, nick } = each;
          listHTML.innerHTML += `<div class="jogador ${id}">
                                  <img src="${avatarURL}" alt="" class="circle"></img>
                                  <span>${nick}</span>
                                  <button class="buttonBlockLista button-${id}">Remover</button>
                                 </div>`;
          $( document ).on( 'click', '.button-' + id, function () {
            // Remover a DIV do respectivo player
            const selector = document.getElementsByClassName( id )[0];
            console.log( selector );
            selector.parentNode.removeChild( selector );
            //Remover da lista de bloqueio
            removerDaLista( { id, avatarURL, nick }, function ( tamanho ) {
              if ( tamanho === 0 ) {
                listHTML.innerHTML += blackBlackList;
                carregarTraducao();
              }
            } );
          } );
        } );
      } else {
        listHTML.innerHTML += blackBlackList;
      }
    } else {
      listHTML.innerHTML += blackBlackList;
    }
  } );
}

iniciarPaginaOpcoes();
