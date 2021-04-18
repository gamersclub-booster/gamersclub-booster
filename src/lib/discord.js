import axios from 'axios';
import { getMapImage } from './maps';
import { GC_URL } from './constants';

export async function send( url, body ) {
  return axios.post( url, {
    embeds: [ body ]
  } );
}

export async function testWebhook( url ) {
  return send( url, {
    title: 'Gamers Club Booster',
    color: '4961603',
    fields: [
      {
        name: 'Status',
        value: 'OK, se você recebeu essa mensagem está tudo certo e seu webhook foi integrado'
      }
    ]
  } );
}

export async function sendLobby( url, lobbyInfo ) {
  if ( url && url.length === 0 ) { return false; }

  if ( typeof lobbyInfo !== 'object' ) {
    return false;
  }

  const mapasVetados =
    lobbyInfo.preVetoedMaps.length !== 0 ?
      lobbyInfo.preVetoedMaps
        .map( each => {
          return each.name;
        } )
        .join( ', ' )
        .slice( 0, -2 ) :
      'Nenhum pré veto';

  await send( url, {
    title: 'Clique aqui para abrir a lobby',
    color: '2391737',
    url: `https://${GC_URL}/j/${lobbyInfo.lobby.lobbyID}/${lobbyInfo.lobby.password}`,
    fields: [
      {
        name: 'Tipo da sala:',
        value: lobbyInfo.lobby.hasPassword ? 'FECHADA' : 'ABERTA'
      },
      {
        name: 'Admin da sala:',
        value: `${lobbyInfo.admin.nick} | ${lobbyInfo.admin.level}`
      },
      {
        name: 'Lobby:',
        value: `Sequencia de viória do admin: ${lobbyInfo.lobby.adminVictorySequence}`
      },
      {
        name: 'Pré vetos',
        value: `${mapasVetados}`
      },
      {
        name: 'Membros:',
        value: Object.values( lobbyInfo.members )
          .map( function ( e ) {
            return `${e.nick} | ${e.level} | KDR: ${e.kdr} \n`;
          } )
          .join( ' ' )
      }
    ]
  } );
}

function getTeamInfo( data ) {
  const membersFull = data.members;
  const membersArray = Object.values( membersFull );
  const membersString = membersArray.map( function ( e ) {
    return `${e.level} - ${e.nick} | ${e.kdr} \n`;
  } );

  return membersString.join( '' );
}

export async function sendMatchInfo( url, gcMatch ) {
  if ( typeof gcMatch !== 'object' ) {
    return false;
  }

  const map = Object.values( gcMatch.maps ).filter( function ( e ) {
    return e.vetoed === undefined;
  } )[0].name;

  await send( url, {
    color: '2391737',
    fields: [
      {
        name: 'Time A',
        value: getTeamInfo( gcMatch.room_a )
      },
      {
        name: 'Time B',
        value: getTeamInfo( gcMatch.room_b )
      },
      {
        name: 'IP da partida:',
        value: `connect ${gcMatch.game.live.ip};password ${gcMatch.game.live.password}`
      },
      {
        name: 'Mapa:',
        value: map
      },
      {
        name: 'Link da partida',
        value: `https://${GC_URL}/lobby/partida/${gcMatch.game.gameID}`
      }
    ],
    image: {
      url: getMapImage( map )
    }
  } );
}
