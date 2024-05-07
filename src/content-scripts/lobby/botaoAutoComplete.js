import { preVetosMapas } from '../../lib/constants';
import { alertaMsg } from '../../lib/messageAlerts';
import { getAllStorageSyncData, getTranslationText } from '../../utils';

let intervalId;

export async function adicionarBotaoAutoComplete() {
  const { traducao } = await getAllStorageSyncData();

  const completarPartidaText = getTranslationText( 'completar-partida', traducao );
  const procurandoCompleteText = getTranslationText( 'procurando-complete', traducao );
  const voceEstaEmLobbyText = getTranslationText( 'voce-esta-em-uma-lobby', traducao );


  const handleStartAutoComplete = async btn => {
    // Se não estiver em lobby
    if ( !$( '#SidebarSala' ).length ) {
      intervalerAutoComplete();
      btn.text( procurandoCompleteText ).addClass( 'cancel-auto-complete' );

    // Se estiver em lobby e tentar clicar no botão de complete
    } else { alertaMsg( voceEstaEmLobbyText ); }
  };

  const handleStopAutoComplete = async btn => {
    clearInterval( intervalId );

    btn.text( completarPartidaText ).removeClass( 'cancel-auto-complete' );
  };

  const addListeners = () => {
    const $autoCompleteBtn = $( '#btn-auto-complete' );

    $autoCompleteBtn.parent().css( {
      'grid-template-columns': '1fr 1fr',
      'display': 'grid'
    } );

    $autoCompleteBtn.on( 'click', async function () {
      if ( $autoCompleteBtn.hasClass( 'cancel-auto-complete' ) ) { // Se já estiver buscando
        handleStopAutoComplete( $autoCompleteBtn );

      } else { // Se não estiver buscando ainda
        handleStartAutoComplete( $autoCompleteBtn );
      }
    } );
  };


  if ( !$( '#btn-auto-complete' ).length ) { // Se precisa criar o botão e adicionar na página

    const observer = new MutationObserver( () => {
      const btnAlreadyExists = $( '#btn-auto-complete' ).length;
      const isReadyToInsert = $( '#lobby-actions-create-lobby-button' ).length;

      if ( btnAlreadyExists || !isReadyToInsert ) { return; }

      $( '#lobby-actions-create-lobby-button' ).parent()
        .prepend( $( '<button/>', {
          'id': 'btn-auto-complete',
          'class': 'WasdButton WasdButton--primary WasdButton--lg WasdButton--block',
          'type': 'button',
          'text': completarPartidaText
        } )
        );

      // cria uma pequena animação para o botão não aparecer de forma brusca
      setTimeout( () => { $( '#btn-auto-complete' ).addClass( 'btn-visible' ); }, 100 );

      addListeners();
    } );

    observer.observe( document.body, { childList: true, subtree: true } );
  }
}

async function intervalerAutoComplete() {
  intervalId = setInterval( async function () {
    // Verifique se não estamos no lobby
    if ( $( '#SidebarSala' ).length === 0 ) {
      const acceptBtn = $( '.scroll-content > li > .btn-actions > a.accept-btn' );

      if ( acceptBtn.length ) {
        const scoreSpans = $( '.scroll-content > li > .match-info > .result-type > .score > span' );
        const mapCode = getMapCode( $( '.map-name' ).text() );

        if ( scoreSpans.length === 2 && mapCode ) {
          const score1 = parseInt( scoreSpans.eq( 0 ).text() );
          const score2 = parseInt( scoreSpans.eq( 1 ).text() );

          chrome.storage.sync.get( [ 'complete', 'roundsDiff', 'roundsMin' ], res => {
            const { complete, roundsDiff, roundsMin } = res || {};

            const isInCheckedMaps = !complete || complete.includes( mapCode );
            const hasMinRounds = ( score1 + score2 ) >= roundsMin;
            const isInDiff = Math.abs( score1 - score2 ) <= roundsDiff;

            if ( isInCheckedMaps && hasMinRounds && isInDiff ) {
              acceptBtn.get( 0 ).click();
              $( '#completePlayerModal > div > div.buttons > button.sm-button-accept.btn.btn-success' ).get( 0 ).click();
            }
          } );
        }
      }
    } else {
      clearInterval( intervalId );
    }
  }, 250 );
}

function getMapCode( mapName ) {
  if ( mapName ) {
    return preVetosMapas.filter( e => {
      return e.mapa === mapName;
    } )[0].codigo;
  } else {
    return null;
  }
}
