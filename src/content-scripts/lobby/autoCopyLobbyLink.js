import axios from 'axios';
import { GC_URL } from '../../lib/constants';
import { alertaMsg } from '../../lib/messageAlerts';

export const autoCopyLobbyLink = mutations => {
  chrome.storage.sync.get( [ 'autoCopyLobbyLink' ], result => {
    if ( !result.autoCopyLobbyLink ) {
      return;
    }

    mutations.forEach( async mutation => {
      if ( !mutation.addedNodes ) {
        return;
      }

      for ( let i = 0; i < mutation.addedNodes.length; i++ ) {
        const node = mutation.addedNodes[i];

        if (
          node.nextElementSibling &&
          node.nextElementSibling.className &&
          node.nextElementSibling.className.includes( 'MyRoom' )
        ) {
          try {
            const lobbyInfo = await axios.post( `https://${GC_URL}/lobbyBeta/openRoom` );
            const lobbyId = lobbyInfo?.data?.lobby?.lobbyID;
            const password = lobbyInfo?.data?.lobby?.password || '';
            const url = lobbyId ?
              `https://${GC_URL}/j/${lobbyId}/${password}` + '?utm_source=lobby&utm_medium=invite&utm_campaign=user_invitation' : null;

            if ( !url ) { throw new Error( 'Lobby URL não disponível' ); }

            await navigator.clipboard.writeText( url );
            alertaMsg( '[GC Booster] - Link da lobby copiado automaticamente!' );
          } catch ( error ) {
            console.error( 'Erro ao obter/copiar link da lobby:', error );
          }
        }
      }
    } );
  } );
};
