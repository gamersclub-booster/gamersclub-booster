import axios from 'axios';
import { GC_URL } from '../../lib/constants';
import { sendLobby } from '../../lib/discord';
import { alertaMsg } from '../../lib/messageAlerts';

const BUTTON_ID = 'discordLobbyButton';
const LOBBY_ROOM_SELECTOR = 'button.MyRoomHeader__button.MyRoomHeader__button--delete-room';

const isButtonAlreadyAdded = () => document.getElementById( BUTTON_ID ) !== null;

const isValidWebhookUrl = webhookUrl => {
  if ( !webhookUrl || typeof webhookUrl !== 'string' ) {
    return false;
  }
  return webhookUrl.startsWith( 'http://' ) || webhookUrl.startsWith( 'https://' );
};

const isMyRoomNode = node => {
  return (
    node &&
    node.nextElementSibling &&
    node.nextElementSibling.className &&
    typeof node.nextElementSibling.className === 'string' &&
    node.nextElementSibling.className.includes( 'MyRoom' )
  );
};

const sendLobbyToDiscord = async webhookUrl => {
  try {
    const response = await axios.post( `https://${ GC_URL }/lobbyBeta/openRoom` );

    if ( !response || !response.data ) {
      throw new Error( 'Resposta inválida da API' );
    }

    await sendLobby( webhookUrl, response.data );
    alertaMsg( '[Discord] - Enviado com sucesso' );
    return true;
  } catch ( error ) {
    console.error( '[GamersClub Booster] Erro ao enviar lobby para Discord:', error );

    let errorMessage = '[Discord] - Erro ao enviar lobby';
    if ( error.response ) {
      errorMessage += `: ${error.response.status} ${error.response.statusText}`;
    } else if ( error.request ) {
      errorMessage += ': Sem resposta do servidor';
    } else {
      errorMessage += `: ${error.message}`;
    }

    alertaMsg( errorMessage );
    return false;
  }
};

const createDiscordButton = discordSvgUrl => {
  const button = document.createElement( 'button' );
  button.id = BUTTON_ID;
  button.className = 'MyRoomHeader__button';
  button.title = 'Enviar lobby Discord';
  button.setAttribute( 'data-jsaction', 'gcCommonTooltip' );
  button.setAttribute( 'data-tip-text', 'Enviar lobby Discord' );
  button.style.cssText = 'width:75px;margin-left:var(--wasd-spacing-xxs);background:#5865F2';

  const img = document.createElement( 'img' );
  img.src = discordSvgUrl;
  img.width = 15;
  button.appendChild( img );

  return button;
};

const addDiscordButton = webhookUrl => {
  if ( isButtonAlreadyAdded() ) {
    return;
  }

  const deleteRoomButton = document.querySelector( LOBBY_ROOM_SELECTOR );
  if ( !deleteRoomButton || !deleteRoomButton.parentNode ) {
    console.warn( '[GamersClub Booster] Botão de deletar sala não encontrado' );
    return;
  }

  const discordSvgUrl = chrome.runtime.getURL( '/images/discord.svg' );
  const discordButton = createDiscordButton( discordSvgUrl );

  discordButton.addEventListener( 'click', async event => {
    event.preventDefault();

    discordButton.disabled = true;
    const originalText = discordButton.innerHTML;
    discordButton.innerHTML = '<span>Enviando...</span>';

    try {
      await sendLobbyToDiscord( webhookUrl );
    } finally {
      discordButton.disabled = false;
      discordButton.innerHTML = originalText;
    }
  } );

  deleteRoomButton.parentNode.insertBefore( discordButton, deleteRoomButton );
};

const processMutations = async ( mutations, webhookUrl, shouldAutoSend ) => {
  if ( isButtonAlreadyAdded() ) {
    return;
  }

  for ( const mutation of mutations ) {
    if ( !mutation.addedNodes || mutation.addedNodes.length === 0 ) {
      continue;
    }

    for ( const node of mutation.addedNodes ) {
      if ( node.nodeType !== Node.ELEMENT_NODE ) {
        continue;
      }

      if ( isMyRoomNode( node ) ) {
        addDiscordButton( webhookUrl );

        if ( shouldAutoSend ) {
          await sendLobbyToDiscord( webhookUrl );
        }
        return;
      }
    }
  }
};

export const lobbyLink = mutations => {
  chrome.storage.sync.get( [ 'webhookLink', 'enviarLinkLobby' ], result => {
    if ( !result.webhookLink || !isValidWebhookUrl( result.webhookLink ) ) {
      return;
    }

    processMutations( mutations, result.webhookLink, result.enviarLinkLobby ).catch( error => {
      console.error( '[GamersClub Booster] Erro ao processar mutações:', error );
    } );
  } );
};
