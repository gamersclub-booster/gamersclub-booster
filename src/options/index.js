import { features, preVetosMapas, configValues, paginas, audios } from '../lib/constants';
import { saveJson, loadJson } from '../lib/blockList';
// import { removerDaLista } from '../lib/blockList';
import { testWebhook } from '../lib/discord';
import manifest from '../../manifest.json';
import pt from '../translations/pt.json';
import en from '../translations/en.json';
import es from '../translations/es.json';
import fr from '../translations/fr.json';

const translations = {
  'pt': pt,
  'en': en,
  'es': es,
  'fr': fr
};

function iniciarPaginaOpcoes() {
  mostrarMensagemAtencao();
  adicionaVersao();
  marcarCheckboxes();
  marcarPreVetos();
  marcarCompleteMapas();
  adicionarListenersFeatures();
  adicionarListenersPaginas();
  adicionarListenerPreVetos();
  adicionarListenerCompleteMapas();
  popularAudioOptions();
  popularServerWebHookOptions();
  selecionarSons();
  atualizarValorVolume();
  adicionarListenersSons();
  loadWebhook();
  adicionarListenerTraducao();
  loadBlockList();
  listenerButtonBlockList();
  listenerJogarCom();
  marcarJogarCom();
  popularComplete();
}

function mostrarMensagemAtencao() {
  chrome.storage.sync.get ( [ 'mensagemLida' ], response => {
    if ( !response.mensagemLida ) {
      $( '.conteudo' ).css( 'display', 'none' );
      $( '#botaoEntendi' ).on( 'click', () => {
        $( '.containerMensagem' ).remove();
        $( '.conteudo' ).css( 'display', '' );
        chrome.storage.sync.set( { mensagemLida: true } );
      } );
    } else {
      $( '.containerMensagem' ).remove();
    }
  } );
}

function limparPreVetos( preVetos, mapa ) {
  const index = preVetos.indexOf( mapa );
  if ( index > -1 ) {
    const mapas = preVetos;
    mapas.splice( index, 1 );
    console.log( mapas );
    chrome.storage.sync.set( { preVetos: mapas } );
  }
}

function limparComplete( complete, mapa ) {
  const index = complete.indexOf( mapa );
  if ( index > -1 ) {
    const mapas = complete;
    mapas.splice( index, 1 );
    chrome.storage.sync.set( { complete: mapas } );
  }
}

function limparOpcoesInvalidas() {
  const mapasInvalidos = [
    11, // cbble_classic
    13, // tuscan
    16 // cache_old
  ];
  chrome.storage.sync.get( [ 'preVetos' ], res => {
    if ( res.preVetos && res.preVetos.length > 0 ) {
      for ( const mapa of mapasInvalidos ) {
        limparPreVetos( res.preVetos, mapa );
      }
    }
  } );
  chrome.storage.sync.get( [ 'complete' ], res => {
    if ( res.complete && res.complete.length > 0 ) {
      for ( const mapa of mapasInvalidos ) {
        limparComplete( res.complete, mapa );
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
    let value = false;
    for ( const key in translations ) {
      value = ( ( ( lang === key ) && lang ) || value ) || 'pt';
    }
    carregarTraducao( value );
    document.getElementById( `traducao-${value}` ).classList.add( 'translate-active' );
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
  for ( const selectId of [ 'somReady', 'somKicked' ] ) {
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

function marcarCompleteMapas() {
  chrome.storage.sync.get( [ 'complete' ], response => {
    if ( !response.complete ) { return false; }
    for ( let i = 0; i < response.complete.length; i++ ) {
      const codigo = response.complete[i];
      const mapaNome = preVetosMapas.filter( e => {
        return e.codigo === codigo;
      } )[0].mapa;
      document.getElementById( 'complete' + mapaNome ).checked = true;
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

function adicionarListenerCompleteMapas() {
  for ( const mapa of preVetosMapas ) {
    const idSelector = 'complete' + mapa.mapa;

    document.getElementById( idSelector ).addEventListener( 'change', function () {
      const codigo = document.getElementById( idSelector ).getAttribute( 'codigo' );
      chrome.storage.sync.get( [ 'complete' ], res => {
        const complete = res.complete;
        if ( this.checked ) {
          //adicionar
          if ( complete === undefined ) {
            //Primeira vez add um mapa
            chrome.storage.sync.set( { complete: [ Number( codigo ) ] } );
          } else {
            chrome.storage.sync.get( [ 'complete' ], res => {
              const completeAntes = res.complete;
              completeAntes.push( Number( codigo ) );
              chrome.storage.sync.set( { complete: completeAntes } );
            } );
          }
        } else {
          //desmarquei
          const completeAntes = complete;
          const completeDepois = arrayRemove( completeAntes, Number( codigo ) );
          chrome.storage.sync.set( { complete: completeDepois } );
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
      document.getElementById( config ).value = response[config] || '';
    }

    updateReadySoundInputsDisable();
  } );
}

function atualizarValorVolume() {
  chrome.storage.sync.get( [ 'volume' ], function ( data ) {
    if ( data.volume ) {
      document.getElementById( 'volumeValue' ).innerText = `${data.volume}%`;
    }
  } );
}

function updateReadySoundInputsDisable( sound ) {
  const isDefaultSound = !document.getElementById( sound ).value;

  switch ( sound ) {
  case 'somReady':
    document.getElementById( 'testarSomReady' ).disabled = isDefaultSound;
    break;
  case 'somKicked':
    document.getElementById( 'testarSomKicked' ).disabled = isDefaultSound;
    break;
  }

  document.getElementById( 'volume' ).disabled = isDefaultSound;
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
  document.getElementById( 'somReady' ).addEventListener( 'input', () => updateReadySoundInputsDisable( 'somReady' ) );

  //SOM SE FOR EXPULSO DA LOBBY
  document.getElementById( 'testarSomKicked' ).addEventListener( 'click', function () {
    const som =
      document.getElementById( 'somKicked' ).value === 'custom' ?
        document.getElementById( 'customSomKicked' ).value :
        document.getElementById( 'somKicked' ).value;
    const audio = new Audio( som );
    audio.volume = document.getElementById( 'volume' ).value / 100;
    audio.play();
  } );

  document.getElementById( 'volume' ).addEventListener( 'input', function () {
    const volume = document.getElementById( 'volume' ).value;
    document.getElementById( 'volumeValue' ).innerText = `${volume}%`;
  } );
  document.getElementById( 'somKicked' ).addEventListener( 'input', () => updateReadySoundInputsDisable( 'somKicked' ) );


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
      $( '#serversSelect' ).val( data.webhookLink );

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
    chrome.storage.sync.set( { ['webhookServers']: [ ] } );
    $( '#serversSelect' ).empty();

    $( '#group-add-server' ).hide();

    document.getElementById( 'divDoDiscord' ).hidden = true;
    document.getElementById( 'enviarLinkLobby' ).checked = false;
    document.getElementById( 'enviarPartida' ).checked = false;
    document.getElementById( 'campoWebhookLink' ).value = '';
  } );

  document.getElementById( 'testarWebhook' ).addEventListener( 'click', async function () {
    const url = $( '#serversSelect' ).val();
    chrome.storage.sync.set( { ['webhookLink']: url } );

    if ( url.length !== 0 ) {
      try {
        await testWebhook( url );
        document.getElementById( 'statusWebhook' ).innerText = 'OK! Salvando a URL';
        chrome.storage.sync.set( { ['statusWebhook']: 'OK', ['webhookLink']: url }, async function () {
          document.getElementById( 'statusWebhook' ).innerText = 'OK';
          document.getElementById( 'divDoDiscord' ).removeAttribute( 'hidden' );
        } );
      } catch ( e ) {
        document.getElementById( 'statusWebhook' ).innerText = 'Erro na URL, tente novamente.';
        document.getElementById( 'divDoDiscord' ).setAttribute( 'hidden', true );
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

  document.getElementById( 'addWebhook' ).addEventListener( 'click', async function () {
    let listServers = [];


    chrome.storage.sync.get( [ 'webhookServers' ], function ( e ) {
      // Pega os valores dos campos
      const url = $( '#campoWebhookLink' ).val();
      const nameServer = $( '#campoWebhookName' ).val();

      if ( url.length !== 0 && nameServer.length !== 0 ) {
        $( '#group-add-server' ).show();

        if ( e.webhookServers ) {
          listServers = e.webhookServers ;
        }
        listServers.push( { url, nameServer } );
      }

      console.log( listServers, 'listServers' );

      try {
        // await testWebhook( url );
        // Salva os valores na store
        chrome.storage.sync.set( { ['webhookServers']: [ ...listServers ] }, async function () {
          $( '#divDoDiscord' ).removeAttr( 'hidden' );

          // Adiciona na lista de servidores
          $( '#serversSelect' ).prepend( $( '<option>', {
            value: url,
            text: nameServer
          } ) );

          // Seleciona a primeira opção
          $( '#serversSelect' ).prop( 'selectedIndex', 0 );

          $( '#statusWebhook' ).text( 'Adicionado na lista' );
          $( '#campoWebhookLink' ).val( '' );
          $( '#campoWebhookName' ).val( '' );
          //   $.each(items, function (i, item) {
          //     $('#mySelect').append($('<option>', {
          //         value: item.value,
          //         text : item.text
          //     }));
          // });
        } );

      } catch ( e ) {
        $( '#statusWebhook' ).text( 'Erro na URL, tente novamente.' );
        // document.getElementById( 'divDoDiscord' ).setAttribute( 'hidden', true );
      }
    } );
  } );
}

async function popularServerWebHookOptions() {
  try {
    chrome.storage.sync.get( [ 'webhookServers' ], function ( e ) {
      console.log( e.webhookServers, 'hooks' );
      if ( e.webhookServers?.length > 0 ) {
        $.each( e.webhookServers, function ( i, item ) {
          console.log( item );
          $( '#serversSelect' ).append( $( '<option>', {
            value: item.url,
            text: item.nameServer
          } ) );
        } );

        chrome.storage.sync.get( [ 'webhookLink' ], function ( e ) {
          if ( e.webhookLink ) {
            $( '#serversSelect' ).val( e.webhookLink );
          }
        } );
      } else {
        $( '#group-add-server' ).hide();
      }
    } );
  } catch ( error ) {
    console.log( error, 'error' );
  }
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
  <ul>
    <li translation-key="ninguemNaLista"></li>
    <li translation-key="comoAddnaLista"></li>
    <li translation-key="notificacao"></li>
  </ul>`;

  chrome.storage.sync.get( [ 'blockList' ], function ( data ) {
    const listHTML = document.getElementById( 'lista' );

    if ( data.blockList ) {
      if ( typeof data.blockList === 'object' && data.blockList.length > 0 ) {
        data.blockList.map( each => {
          const { id, avatarURL, nick } = each;

          const numericId = id.split( '/' ).pop();

          // Adicionar o jogar na lista e o botão remover
          listHTML.innerHTML += `<div class="jogador ${numericId}">
                                  <a href="${id}" target="_blank" class="links jogador-info">
                                  <img src="${avatarURL}" alt="" class="circle" />
                                  <span>${nick}</span>
                                  </a>
                                  <button class="btn btn-secondary" remove-button="${numericId}">Remover</button></div>`;


        } );

        // Remover o jogador da lista
        $( '[remove-button]' ).each( function () {
          const numericId = $( this ).attr( 'remove-button' );

          $( this ).on( 'click', function ( ) {
            chrome.storage.sync.get( [ 'blockList' ], function ( data ) {
              const list = data.blockList;
              const newList = list.filter( each => each.id.split( '/' ).pop() !== numericId );

              chrome.storage.sync.set( { ['blockList']: newList }, function () {
                carregarTraducao();
                $( '.jogador.' + numericId ).remove();
              } );
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

function listenerJogarCom() {
  const radioButtons = document.getElementsByName( 'jogarCom' );
  radioButtons.forEach( element => {
    element.addEventListener( 'click', function () {
      chrome.storage.sync.set( { jogarCom: element.value } );
    } );
  } );
}

function marcarJogarCom() {
  chrome.storage.sync.get( [ 'jogarCom' ], response => {
    if ( !response.jogarCom ) { return false; }
    const radioButtons = document.getElementsByName( 'jogarCom' );
    radioButtons.forEach( element => {
      if ( element.value === response.jogarCom ) {
        element.checked = true;
      }
    } );
  } );
}

const sliderDiff = document.getElementById( 'slider-rounds-diff' );
const sliderMin = document.getElementById( 'slider-rounds-min' );

function popularComplete() {
  chrome.storage.sync.get( [ 'roundsDiff' ], response => {
    if ( !response.roundsDiff ) { return false; }
    sliderDiff.value = response.roundsDiff;
    completeMaxDiffText();
  } );
  chrome.storage.sync.get( [ 'roundsMin' ], response => {
    if ( !response.roundsMin ) { return false; }
    sliderMin.value = response.roundsMin;
    completeMinText();
  } );
}

sliderDiff.addEventListener( 'change', function () {
  completeMaxDiffText();
} );

function completeMaxDiffText() {
  const value = sliderDiff.value;
  document.getElementById( 'rounds-diff' ).innerHTML = value + ' rounds';
  chrome.storage.sync.set( { 'roundsDiff': value } );
}

sliderMin.addEventListener( 'change', function () {
  completeMinText();
} );

function completeMinText() {
  const value = sliderMin.value;
  document.getElementById( 'rounds-min' ).innerHTML = value + ' rounds';
  chrome.storage.sync.set( { 'roundsMin': value } );
}

limparOpcoesInvalidas();
iniciarPaginaOpcoes();
