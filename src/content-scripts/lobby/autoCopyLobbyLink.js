import axios from 'axios';
import { GC_URL } from '../../lib/constants';
import { alertaMsg } from '../../lib/messageAlerts';

let lobbyLinkCopied = false;
let currentLobbyId = null;

const copyToClipboard = async text => {
  try {
    if ( navigator.clipboard && window.isSecureContext ) {
      await navigator.clipboard.writeText( text );
      return true;
    }
  } catch ( error ) {
    console.warn( 'Não conseguiu copiar:', error );
  }

  try {
    const textArea = document.createElement( 'textarea' );
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild( textArea );
    textArea.focus();
    textArea.select();

    const successful = document.execCommand( 'copy' );
    document.body.removeChild( textArea );

    return successful;
  } catch ( error ) {
    return false;
  }
};

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
          node.nextElementSibling.className.includes( 'MyRoom' ) &&
          !lobbyLinkCopied
        ) {
          try {
            const lobbyInfo = await axios.post( `https://${GC_URL}/lobbyBeta/openRoom` );
            const lobbyId = lobbyInfo?.data?.lobby?.lobbyID;
            const password = lobbyInfo?.data?.lobby?.password || '';
            const url = lobbyId ?
              `https://${GC_URL}/j/${lobbyId}/${password}` + '?utm_source=lobby&utm_medium=invite&utm_campaign=user_invitation' : null;

            if ( !url ) { throw new Error( 'Lobby URL não disponível' ); }

            if ( currentLobbyId !== lobbyId ) {
              const copySuccess = await copyToClipboard( url );

              if ( copySuccess ) {
                alertaMsg( '[GC Booster] - Link da lobby copiado automaticamente!' );
                lobbyLinkCopied = true;
                currentLobbyId = lobbyId;
              }
            }
          } catch ( error ) {
            console.error( 'Erro ao obter/copiar link da lobby:', error );
          }
        }
      }
    } );
  } );
};

export const resetLobbyLinkState = () => {
  lobbyLinkCopied = false;
  currentLobbyId = null;
};
