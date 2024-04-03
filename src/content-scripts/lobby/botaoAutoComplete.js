import { alertaMsg } from '../../lib/messageAlerts';
import { getAllStorageSyncData, getTranslationText } from '../../utils';
import { preVetosMapas } from '../../lib/constants';

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
    if ( !$( '#SidebarSala' ).length ) { // Se não estiver em lobby ( acontece quando cria lobby e já está buscando complete )
      chrome.storage.sync.get( [ 'complete', 'roundsDiff', 'roundsMin' ], async res => {
        if ( $( '.scroll-content > li > .btn-actions > a.accept-btn' ).length ) {
          const score1 = $( '.scroll-content > li > .match-info > .result-type > .score > span' ).eq( 0 ).text();
          const score2 = $( '.scroll-content > li > .match-info > .result-type > .score > span' ).eq( 1 ).text();
          const mapCode = getMapCode( $( '.map-name' ).text() );

          if ( score1 && score2 && mapCode ) {
            let isInCheckedMaps = true, hasMinRounds = true, isInDiff = true;

            if ( res.complete ) {
              isInCheckedMaps = !res.complete.length || res.complete.includes( mapCode );
            }

            if ( res.roundsMin ) {
              hasMinRounds = ( parseInt( score1 ) + parseInt( score2 ) ) >= res.roundsMin;
            }

            if ( res.roundsDiff ) {
              isInDiff = Math.abs( score1 - score2 ) <= res.roundsDiff;
            }

            if ( isInCheckedMaps && isInDiff && hasMinRounds ) {
              $( '.scroll-content > li > .btn-actions > a.accept-btn' ).get( 0 ).click();
              $( '#completePlayerModal > div > div.buttons > button.sm-button-accept.btn.btn-success' ).get( 0 ).click();
            }
          }
        }
      } );
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
