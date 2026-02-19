import { preVetosMapas } from '../../lib/constants';
import { alertaMsg } from '../../lib/messageAlerts';
import { getAllStorageSyncData, getTranslationText } from '../../utils';

let intervalId;

export async function adicionarBotaoAutoComplete() {
  const { traducao } = await getAllStorageSyncData();

  const completarPartidaText = getTranslationText( 'completar-partida', traducao );
  const procurandoCompleteText = getTranslationText( 'procurando-complete', traducao );
  const voceEstaEmLobbyText = getTranslationText( 'voce-esta-em-uma-lobby', traducao );


  const handleStartAutoComplete = btn => {
    // Se não estiver em lobby
    if ( !$( '#SidebarSala' ).length ) {
      clearInterval( intervalId );
      intervalerAutoComplete();
      btn.text( procurandoCompleteText ).addClass( 'cancel-auto-complete' );

    // Se estiver em lobby e tentar clicar no botão de complete
    } else { alertaMsg( voceEstaEmLobbyText ); }
  };

  const handleStopAutoComplete = btn => {
    clearInterval( intervalId );

    btn.text( completarPartidaText ).removeClass( 'cancel-auto-complete' );
  };

  const addListeners = () => {
    const $autoCompleteBtn = $( '#btn-auto-complete' );

    $autoCompleteBtn.parent().css( {
      'grid-template-columns': 'repeat(3, 1fr)',
      'display': 'grid'
    } );
    $autoCompleteBtn.parent().parent().css( {
      'padding': '12px 12px'
    } );

    $autoCompleteBtn.on( 'click', function () {
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
        .append( $( '<button/>', {
          'id': 'btn-auto-complete',
          'class': 'WasdButton WasdButton--primary WasdButton--lg WasdButton--block draw-orange btn-visible',
          'type': 'button',
          'text': completarPartidaText,
          'title': `[GC Booster]: ${completarPartidaText}`
        } ) );

      addListeners();
      observer.disconnect();
    } );

    observer.observe( document.body, { childList: true, subtree: true } );
  }
}

function intervalerAutoComplete() {
  intervalId = setInterval( function () {
    // Verifique se não está no lobby
    if ( $( '#SidebarSala' ).length === 0 ) {
      const acceptBtn = $( '.LobbyComplete__requestItemContainer > button' );

      if ( acceptBtn.length ) {
        const scoreWinning = parseInt( $( '.LobbyComplete__requestItemScore .LobbyComplete__requestItemScoreWinning' ).eq( 0 ).text() );
        const scoreLosing = parseInt( $( '.LobbyComplete__requestItemScore .LobbyComplete__requestItemScoreLosing' ).eq( 0 ).text() );
        const mapCode = getMapCode( $( '.LobbyComplete__requestItemMap' ).text() );

        if ( Number.isFinite( scoreWinning ) && Number.isFinite( scoreLosing ) && mapCode ) {
          chrome.storage.sync.get( [ 'complete', 'roundsDiff', 'roundsMin', 'roundsMax' ], res => {
            const { complete, roundsDiff, roundsMin, roundsMax } = res || {};

            const isInCheckedMaps = !complete || complete.includes( mapCode );
            const hasMinRounds = ( scoreWinning + scoreLosing ) >= ( roundsMin || 0 );
            const isInDiff = Math.abs( scoreWinning - scoreLosing ) <= ( roundsDiff || 13 );
            const hasMaxWinningRounds = scoreWinning <= ( roundsMax || 12 );

            if ( isInCheckedMaps && hasMinRounds && isInDiff && hasMaxWinningRounds ) {
              clearInterval( intervalId );

              // Clica no botão de aceitar do complete
              acceptBtn.get( 0 ).click();

              // Aguarda o modal aparecer e clica na confirmação
              const confirmationAttempt = setInterval( () => {
                let confirmBtn = $( '#completePlayerModal .sm-button-accept.btn.btn-success' );

                // Fallback: procura por qualquer botão de confirmação no modal
                if ( !confirmBtn.length ) {
                  confirmBtn = $( '#completePlayerModal button.btn-success' );
                }

                // Se encontrou o botão, clica e aguarda redirecionamento
                if ( confirmBtn.length ) {
                  confirmBtn.eq( 0 ).click();
                  clearInterval( confirmationAttempt );

                  // Fallback: reload se o redirecionamento não acontecer em 2 segundos
                  setTimeout( () => {
                    if ( window.location.pathname.includes( 'lobby' ) ) {
                      window.location.reload();
                    }
                  }, 2000 );
                }
              }, 100 );

              // Timeout: se não encontrar o botão de confirmação em 3s, avisa o usuário
              setTimeout( () => {
                clearInterval( confirmationAttempt );
                if ( window.location.pathname.includes( 'lobby' ) ) {
                  alertaMsg( 'Não foi possível confirmar o complete automaticamente' );
                }
              }, 3000 );
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
  if ( !mapName || typeof mapName !== 'string' ) {
    return null;
  }

  const mapData = preVetosMapas.find( e => e.mapa === mapName.trim() );

  return mapData ? mapData.codigo : null;
}
