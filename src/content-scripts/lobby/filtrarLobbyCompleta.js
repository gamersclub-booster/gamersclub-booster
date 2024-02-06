
import { getAllStorageSyncData, getTranslationText } from '../../utils';

export const filtrarLobbies = mutations => {
  chrome.storage.sync.get( [ 'filtrarLobbyCompletaAtivo' ], function ( res ) {
    const valorCheckbox = res.filtrarLobbyCompletaAtivo === 'true';
    if ( valorCheckbox ) {
      $.each( mutations, async ( _, mutation ) => {
        const lobbyElement = $( mutation.target ).closest( '.LobbyRoom' ).parent().parent();

        if ( lobbyElement.length ) {
          const totalJogadoresAdicionados = $( mutation.addedNodes ).find( 'a.LobbyPlayerVertical' ).length;
          if ( totalJogadoresAdicionados + lobbyElement.find( 'a.LobbyPlayerVertical' ).length < 5 ) {
            lobbyElement.hide();
          } else {
            lobbyElement.show();
          }
        }
      } );
    }
  } );
};

function toggleFiltro() {
  const autoCompleteCheckbox = $( '#autoCompleteCheckbox' );
  const isChecked = autoCompleteCheckbox.prop( 'checked' );

  $( '.RoomCardWrapper' ).each( function () {
    const lineupDiv = $( this ).find( '.LobbyRoom__lineup' );
    const totalJogadoresAdicionados = lineupDiv.find( 'a.LobbyPlayerVertical' ).length;
    console.log( totalJogadoresAdicionados );

    if ( isChecked && totalJogadoresAdicionados < 5 ) {
      $( this ).hide();
    } else if ( !isChecked ) {
      $( this ).show();
    }
  } );
}

export async function adicionarFiltroLobbyCompleta() {
  const { traducao } = await getAllStorageSyncData();
  const lobbiesCompletasText = getTranslationText( 'lobbies-completas', traducao );

  if ( !$( '#autoCompleteCheckbox' ).length ) {
    chrome.storage.sync.get( [ 'filtrarLobbyCompletaAtivo' ], function ( res ) {
      const checkboxValue = res.filtrarLobbyCompletaAtivo === 'true';
      setTimeout( () => {
        $( '#lobby-filters-container > div:first-child' ).append(
          $( '<div/>', {
            'class': '',
            'css': {
              'display': 'flex',
              'width': '100%',
              'padding-top': '15px'
            }
          } ).append(
            $( '<label/>', {
              'class': '',
              'css': {
                'display': 'flex',
                'position': 'relative',
                'font-family': 'Poppins',
                'font-size': '16px',
                'line-height': '24px',
                'font-weight': '500',
                'font-style': 'normal',
                'color': 'rgba(255, 255, 255, 0.8)',
                'cursor': 'pointer',
                'user-select': 'none',
                'overflow': 'hidden',
                'text-overflow': 'ellipsis',
                'white-space': 'nowrap'
              }
            } ).append(
              $( '<div/>', {
                'class': '',
                'css': {
                  'margin-right': '8px'
                }
              } ).append(
                $( '<input/>', {
                  'id': 'autoCompleteCheckbox',
                  'class': 'WasdCheckbox',
                  'type': 'checkbox',
                  'change': function () {
                    chrome.storage.sync.set( { filtrarLobbyCompletaAtivo: JSON.stringify( this.checked ) } );
                    toggleFiltro();
                  }
                } ).prop( 'checked', checkboxValue ),
                $( '<span/>' )
              ),
              lobbiesCompletasText
            )
          )
        );
      }, 5000 );
    } );
  }
}
