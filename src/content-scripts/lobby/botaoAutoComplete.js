import { alertaMsg } from '../../lib/messageAlerts';
import { getAllStorageSyncData, getTranslationText } from '../../utils';

let interval = 1000;
let intervalId;

export async function adicionarBotaoAutoComplete() {
  const { traducao } = await getAllStorageSyncData();
  const completarPartidaText = getTranslationText( 'completar-partida', traducao );


  if ( !$( '#autoCompleteBtn' ).length ) { // Se precisa criar o botão e adicionar na página
    setTimeout( () => {
      $( '#lobby-actions-create-lobby-button' ).parent()
        .append( $( '<button/>', {
          'id': 'autoCompleteBtn',
          'class': 'WasdButton WasdButton--primary WasdButton--lg WasdButton--block draw-orange',
          'type': 'button',
          'text': completarPartidaText
        } )
        );
      addListeners();
    }, 1500 );
  } else { // Se precisa apenas modificar o botão que já existe
    $( '#autoCompleteBtn' )
      .css( { 'background-color': 'orange', 'border-radius': '4px' } )
      .text( completarPartidaText )
      .removeClass( 'Cancelar' );
  }
}

async function adicionarBotaoCancelar() {
  const { traducao } = await getAllStorageSyncData();
  const procurandoCompleteText = getTranslationText( 'procurando-complete', traducao );
  $( '#autoCompleteBtn' )
    .css( { 'background-color': 'red', 'border-radius': '4px' } )
    .text( procurandoCompleteText )
    .addClass( 'Cancelar' );
}

async function addListeners() {
  const { traducao } = await getAllStorageSyncData();
  const voceEstaEmLobbyText = getTranslationText( 'voce-esta-em-uma-lobby', traducao );

  $( '#autoCompleteBtn' ).on( 'click', async function () {
    if ( $( '#autoCompleteBtn' ).hasClass( 'Cancelar' ) ) { // Se já estiver buscando
      clearInterval( intervalId );
      adicionarBotaoAutoComplete();
    } else { // Se não estiver buscando ainda
      if ( !$( '#SidebarSala' ).length ) { // Se não estiver em lobby
        intervalerAutoComplete();
        await adicionarBotaoCancelar();
      } else { // Se estiver em lobby e tentar clicar no botão de complete
        alertaMsg( voceEstaEmLobbyText );
      }
    }
  } );
}

async function intervalerAutoComplete() {
  intervalId = setInterval( async function () {
    if ( !$( '#SidebarSala' ).length ) { // Se não estiver em lobby ( acontece quando cria lobby e já está buscando complete )
      interval = randomIntFromInterval( 750, 4750 ); // Escolhe um novo intervalo aleatório entre 1s e 5s
      if ( $( '.scroll-content > li > .btn-actions > a.accept-btn' ).length ) {
        setTimeout( function () { // Espera tempo aleatório entre 1 e 5 segundos
          $( '.scroll-content > li > .btn-actions > a.accept-btn' ).get( 0 ).click();
          $( '#completePlayerModal > div > div.buttons > button.sm-button-accept.btn.btn-success' ).get( 0 ).click();
        }, interval );
      }
    } else {
      clearInterval( intervalId );
      await adicionarBotaoAutoComplete();
    }
  }, 250 );
}

function randomIntFromInterval( min, max ) {
  return Math.floor( ( Math.random() * ( max - min + 1 ) ) + min );
}
