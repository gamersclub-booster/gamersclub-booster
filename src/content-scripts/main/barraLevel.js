import { levelColor, levelRatingXP } from '../../lib/constants';
import { retrieveWindowVariables } from '../../lib/dom';
import {
  getFromStorage //,
  // setStorage
} from '../../lib/storage';

const xpRangeFromLevel = level => {
  return {
    minRating: levelRatingXP[level - 1],
    maxRating: levelRatingXP[level]
  };
};

const grabPlayerLastMatch = async matchUrl => {
  const response = await fetch( matchUrl );
  const data = await response.json();

  const lastMatchIndex = data.lastMatches.length - 1;
  const playerInfo = [];
  playerInfo['name'] = data.playerInfo ? data.playerInfo.nick : undefined;
  playerInfo['level'] = parseInt( data.playerInfo.level );
  playerInfo['currentRating'] = data.playerInfo.rating;
  playerInfo['matchId'] = data.lastMatches[lastMatchIndex].id;
  playerInfo['rating_points'] = data.lastMatches[lastMatchIndex].ratingDiff.toString();
  playerInfo['map_name'] = data.lastMatches[lastMatchIndex].map;
  playerInfo['avatar'] = `https://static.gamersclub.com.br/players/avatar/${data.playerInfo.id}/${data.playerInfo.id}_full.jpg`;

  return playerInfo;
};

const grabPlayerHistory = async matchUrl => {
  const response = await fetch( matchUrl );
  const data = await response.json();

  const playerHistory = [];
  playerHistory['kdr'] = data.stat[0].value;

  return playerHistory;
};

export const adicionarBarraLevel = async () => {
  const GC_URL = window.location.hostname;
  const windowVariables = retrieveWindowVariables( [ 'ISSUBSCRIBER', 'PLAYERID' ] );
  const isSubscriber = windowVariables.ISSUBSCRIBER;
  const playerId = windowVariables.PLAYERID;
  if ( !playerId ) { return; }
  const playerInfo = await grabPlayerLastMatch( `https://${GC_URL}/api/box/init/${playerId}` );
  const playerHistory = await grabPlayerHistory( `https://${GC_URL}/api/box/history/${playerId}` );

  const playerKdr = playerHistory['kdr'];

  const playerLevel = playerInfo['level'];
  const currentRating = playerInfo['currentRating'];
  const ratingPoints = playerInfo['rating_points'];
  const matchId = playerInfo['matchId'];
  const namePlayer = playerInfo['name'];
  const playerAvatar = playerInfo['avatar'];

  const minPontos = xpRangeFromLevel( playerLevel ).minRating;
  const maxPontos = xpRangeFromLevel( playerLevel ).maxRating;

  const pontosCair = minPontos - currentRating;
  const pontosSubir = maxPontos - currentRating;

  const playerNextLevel = playerLevel + 1 > 21 ? '' : playerLevel + 1;

  const colorTxt = ratingPoints.includes( '-' ) ? '#ef2f2f' : '#839800';
  const qwertText = '\nClique aqui para ir para a partida!';

  const fixedNum = ( ( ( currentRating - minPontos ) * 100 ) / ( maxPontos - minPontos ) ).toFixed( 2 ) + '%';
  const subscriberStyle = isSubscriber === 'true' ? 'subscriber' : 'nonSubscriber';

  const position = await getFromStorage( 'barLevelPosition', 'local' ) || { left: '50%' };

  const containerDiv = $( `<div class="bar-level" id="gcb-bar-level" style="top:${position.top};left:${position.left} ">` )
    .append( $( '<div class="bar-info-player">' )
      .append( $( '<div class="bar-info-name">' ).text( namePlayer ) )
      .append( $( '<img>' ).attr( 'src', playerAvatar ).addClass( 'bar-level-avatar' ) )
    );
  const currentLevelSpan = $( '<span>' )
    .attr( 'title', `Skill Level ${playerLevel}` )
    .attr( 'data-tip-text', `Skill Level ${playerLevel}` )
    .css( { 'cursor': 'help', 'display': 'inline-block' } )
    .append(
      $( '<div>' )
        .attr( 'class', `PlayerLevel PlayerLevel--${playerLevel} PlayerLevel--${subscriberStyle}` )
        .css( { 'height': '22px', 'width': '22px' } )
        .append(
          $( '<div>' )
            .attr( 'class', 'PlayerLevel__background' )
            .append(
              $( '<span>' )
                .attr( 'class', 'PlayerLevel__text' )
                .text( playerLevel )
            )
        )
    );

  const nextLevelSpan = $( '<span>' )
    .attr( 'title', `Skill Level ${playerNextLevel}` )
    .attr( 'data-tip-text', `Skill Level ${playerNextLevel}` )
    .css( { 'cursor': 'help', 'display': 'inline-block' } )
    .append(
      $( '<div>' )
        .attr( 'class', `PlayerLevel PlayerLevel--${playerNextLevel} PlayerLevel--${subscriberStyle}` )
        .css( { 'height': '22px', 'width': '22px' } )
        .append(
          $( '<div>' )
            .attr( 'class', 'PlayerLevel__background' )
            .append(
              $( '<span>' )
                .attr( 'class', 'PlayerLevel__text' )
                .text( playerNextLevel )
            )
        )
    );

  const progressBarDiv = $( '<div>' )
    .css( { 'margin-right': '4px', 'margin-left': '4px', 'width': '120px' } )
    .append(
      $( '<div>' )
        .attr( 'class', 'text-light' )
        .css( { 'display': 'flex', 'justify-content': 'space-between', 'width': '100%' } )
        .append(
          $( '<div>' )
            .attr( 'class', 'text-sm text-muted bold' )
            .css( { 'align-self': 'flex-end' } )
            .append( $( '<a>' )
              .attr( 'href', matchId ? `//${GC_URL}/lobby/partida/${matchId}` : `//${GC_URL}/my-matches` )
              .append( $( '<span>' )
                .css( { 'color': colorTxt, 'cursor': 'pointer' } )
                .text( ratingPoints.includes( '-' ) ? ratingPoints : '+' + ratingPoints )
                .attr( 'title', (
                  ratingPoints.includes( '-' ) ?
                    'Pontos que você perdeu na última partida' :
                    'Pontos que você ganhou na última partida' ) + qwertText )
              )
            )
        )
        .append( $( '<span class="kdr-level" title="KDR médio">' ).text( playerKdr ).css( {
          'background': playerKdr <= 2 ? '' :
            'linear-gradient(135deg, rgba(0,255,222,0.8) 0%, rgba(245,255,0,0.8) 30%, rgba(255,145,0,1) 60%, rgba(166,0,255,0.8) 100%)',
          'background-color': playerKdr <= 2 ? levelColor[Math.round( playerKdr * 10 )] + 'cc' : 'initial'
        } ) )
        .append(
          $( '<div>' )
            .css( { 'display': 'flex', 'align-items': 'center', 'justify-content': 'flex-end' } )
            .append( $( '<span>' )
              .css( { 'cursor': 'help' } )
              .attr( 'title', 'Rating atual' )
              .text( currentRating )
            )
            .append( $( '<i>' )
              .attr( 'class', 'fas fa-chart-line' )
              .css( { 'margin-left': '4px' } )
            )
        )
    ).append(
      $( '<div>' )
        .append( $( '<div>' )
          .css( { 'margin': '3px 0px', 'height': '3px', 'width': '100%', 'background': 'rgb(75, 78, 78)' } )
          .append( $( '<div>' )
            .css( {
              'height': '100%',
              'max-width': '100%',
              'width': fixedNum,
              'background': 'linear-gradient(to right, ' +
              levelColor[playerLevel] + ', ' +
              levelColor[playerNextLevel] || levelColor[playerLevel] + ')'
            } )
          )
        )
        .append( $( '<div>' )
          .attr( 'class', 'text-sm text-muted' )
          .css( { 'display': 'flex', 'justify-content': 'space-between' } )
          .append( $( '<span>' )
            .text( minPontos )
          )
          .append( $( '<span>' )
            .append( $( '<span>' )
              .css( { 'cursor': 'help' } )
              .attr( 'title', 'Quantidade de pontos para cair de Level' )
              .text( pontosCair )
            )
            .append( $( '<span>' )
              .css( { 'cursor': 'help' } )
              .attr( 'title', 'Quantidade de pontos para subir de Level' )
              .text( '+' + pontosSubir )
            )
          )
          .append( $( '<span>' )
            .text( maxPontos > 2998 ? '∞' : maxPontos )
          )
        )
    );

  $( 'body' )
    .prepend( containerDiv.append( currentLevelSpan ).append( progressBarDiv ).append( nextLevelSpan ) );
};
