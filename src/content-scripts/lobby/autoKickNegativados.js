import axios from 'axios';
import { GC_URL } from '../../lib/constants';

export const autoKickNegativados = () =>
  chrome.storage.sync.get( [ 'autoKickNegativados' ], function ( result ) {
    if ( result.autoKickNegativados ) {
      setInterval( () => {
        $( '.LobbyPlayerHorizontal' ).each( ( index, player ) => {
          if ( index === 0 ) { return; } // Ignora o primeiro player (você mesmo)

          const $player = $( player );

          // Verifica se possui anotação negativa
          const hasNegativeNote = $player.find( '.PlayerAnnotations--negative' ).length > 0;

          if ( hasNegativeNote ) {
            // Pega o id do wrapper que contém o número do jogador
            const idWrapper = $player.find( '[id^="player-trigger-wrapper-"]' ).attr( 'id' );

            const match = idWrapper.match( /player-trigger-wrapper-(\d+)/ );
            if ( match && match[1] ) {
              const playerId = match[1];
              const formData = new FormData();
              formData.append( 'idplayer', playerId );

              axios.post( `https://${GC_URL}/lobbyBeta/kickFromRoom`, formData, {
                withCredentials: true
              } )
                .then( response => {
                  console.log( `Player ${playerId} kickado com sucesso`, response.data );
                } )
                .catch( error => {
                  console.error( `Erro ao kickar player ${playerId}:`, error );
                } );
            }
          }
        } );
      }, 1500 );

    }
  } );

