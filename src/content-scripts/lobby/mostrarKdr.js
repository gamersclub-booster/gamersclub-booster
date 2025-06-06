import { headers, levelColor } from '../../lib/constants';
import { getFromStorage, setStorage } from '../../lib/storage';

export const mostrarKdr = mutations => {
  $.each( mutations, async ( _, mutation ) => {
    $( mutation.addedNodes )
      .find( 'a.LobbyPlayerVertical, .sala-lineup-imagem a' )
      .addBack( 'a.LobbyPlayerVertical, .sala-lineup-imagem a' )
      .each( ( _, element ) => {
        const $element = $( element );
        const $parent = $element.parent();

        if ( !$parent.hasClass( 'sala-lineup-imagem' ) ) {
          $element.css( 'min-height', '120px' );
        }

        if ( $element.find( 'div.PlayerPlaceholder' ).length > 0 ) {
          $element.find( 'div.PlayerPlaceholder__image' ).css( 'margin-top', '23px' );
        } else if ( !$element.find( '#gcbooster_kdr' ).length ) {
          const lobbyId = $element.closest( '[id^="lobby-"]' ).attr( 'id' ).split( '-' )[1];
          const kdr = getKdrFromTitle( $element.attr( 'title' ) );

          const $kdrElement = $( '<div/>', {
            'id': 'gcbooster_kdr',
            'class': 'draw-orange',
            'css': {
              'margin-bottom': '4px',
              'margin-top': '2px',
              'width': '100%',
              'display': 'flex',
              'padding': '2px 4px',
              'align-items': 'center',
              'justify-content': 'center',
              'text-align': 'center',
              'color': 'white',
              'font-weight': '600',
              'border': 'none',
              'background': kdr <= 2.5 ? '' :
                'linear-gradient(135deg, rgba(0,255,222,0.8) 0%, rgba(245,255,0,0.8) 30%, rgba(255,145,0,1) 60%, rgba(166,0,255,0.8) 100%)',
              'background-color': kdr <= 2.5 ? levelColor[Math.round( kdr * 10 )] + 'cc' : 'initial'
            }
          } ).append( $( '<span/>', {
            'id': 'gcbooster_kdr_span',
            'gcbooster_kdr_lobby': lobbyId,
            'text': kdr,
            'kdr': kdr,
            'css': { 'width': '100%', 'font-size': '10px' }
          } ) );

          $element.prepend( $kdrElement );
          $element.find( 'div.LobbyPlayer' ).append( '<style>.LobbyPlayer:before{top:15px !important;}</style>' );
        }
      } );
  } );
};
export const fetchFlag = mutations => {
  $.each( mutations, async ( _, mutation ) => {
    $( mutation.addedNodes )
      .find( 'div.LobbyPlayerHorizontal, div.LobbyPlayerHorizontal--lite' )
      .parent()
      .each( async ( _, element ) => {
        const $element = $( element );
        const $nodeChildren = $element.find( '.LobbyPlayerHorizontal__nickname' );

        const playerLink = $nodeChildren.children( 'a' ).attr( 'href' );
        console.log( $nodeChildren );
        const playerId = playerLink?.split( '/' ).pop() ;
        if ( playerId ) {
          await getPlayerInfo( playerId ).then( infoPlayer => {
            console.log( 'Info do jogador:', infoPlayer );
            const completeUrl = getUrlFlag( infoPlayer?.countryFlag );
            const flagImg = `<img src="${completeUrl}" alt="Flag" class="gcboost-flag b-lazy draw-orange">`;
            $nodeChildren.prepend( flagImg );

            const playerWins = infoPlayer?.currentMonthMatchesHistory?.wins || 0;
            const playerLoss = infoPlayer?.currentMonthMatchesHistory?.loss || 0;
            const playerMatches = infoPlayer?.currentMonthMatchesHistory?.matches || 0;
            const calcWidthPercentage = Math.round( ( playerWins / playerMatches ) * 100 ) + '%';

            const infos = `
            <div class="gcboost-content">
              <div class="gcboost-continaer">
                <div class="gcboost-bar">
                  <span class="wins" style="width: ${calcWidthPercentage}"></span>
                  <span class="losses"></span>
                </div>
              </div>
              <div class="gcboost-result">
                <div>Vitórias: ${playerWins}</div>
                <div class="gcboost-low">Partidas: ${playerMatches}</div>
                <div>Derrotas: ${playerLoss}</div>
              </div>
            </div>`;
            $element.prepend( infos );

          } ).catch( error => {
            console.error( 'Erro ao obter informações do jogador:', error );
          } );
        }
      } );
  } );
};

const getUrlFlag = url => {
  const infoPlayerFlag = url?.split( '/' ).pop(); // br.png
  const upperCaseFlag = infoPlayerFlag?.split( '.' )[0].toUpperCase(); // BR
  const urlFlag = `24x24/${upperCaseFlag}.png`; // 24x24/BR.png
  const completeUrl = `https://gcv1-assets.gamersclub.com.br/assets/images/flags/${urlFlag}`;

  return completeUrl;
};

const getPlayerInfo = async id => {
  // Limpa o cache
  await limparCache( 'infoPlayerCache', 2 * 60 * 60 * 1000 ); // 3 horas

  const infoPlayerCache = await getFromStorage( 'infoPlayerCache' ) || {};

  if ( infoPlayerCache?.[id]?.ttl > Date.now() ) {
    return infoPlayerCache[id]?.infoPlayer;
  }

  const respostaPlayer = await fetch( `https://gamersclub.com.br/api/player-card/${id}`, {
    headers
  } );

  const dadosPlayer = await respostaPlayer.json();
  const infoPlayer = dadosPlayer;

  infoPlayerCache[id] = {
    infoPlayer,
    // TTL de 10 dias
    ttl: Date.now() + ( 2 * 60 * 60 * 1000 ) // 2 horas
  };
  await setStorage( 'infoPlayerCache', infoPlayerCache );

  return infoPlayer ;
};

export const mostrarKdrDesafios = () => {
  const observer = new MutationObserver( () => {
    const challengeCardSelector = '.LobbyChallengeLineUpCard';
    if ( $( challengeCardSelector ).length ) {

      $( challengeCardSelector ).find( 'a.LobbyPlayerVertical, .sala-lineup-imagem a' )
        .addBack( 'a.LobbyPlayerVertical, .sala-lineup-imagem a' )
        .each( ( _, element ) => {
          const $element = $( element );
          const $parent = $element.parent();

          if ( !$parent.hasClass( 'sala-lineup-imagem' ) ) {
            $element.css( 'min-height', '120px' );
          }

          if ( $element.find( 'div.PlayerPlaceholder' ).length > 0 ) {
            $element.find( 'div.PlayerPlaceholder__image' ).css( 'margin-top', '23px' );
          } else if ( !$element.find( '#gcbooster_kdr' ).length ) {
            const kdr = getKdrFromTitle( $element.attr( 'title' ) );

            const $kdrElement = $( '<div/>', {
              'id': 'gcbooster_kdr',
              'class': 'draw-orange',
              'css': {
                'margin-bottom': '4px',
                'margin-top': '2px',
                'width': '100%',
                'display': 'flex',
                'padding': '2px 4px',
                'align-items': 'center',
                'justify-content': 'center',
                'text-align': 'center',
                'color': 'white',
                'font-weight': '600',
                'border': 'none',
                'background': kdr <= 2.5 ? '' :
                  'linear-gradient(135deg, rgba(0,255,222,0.8) 0%, rgba(245,255,0,0.8) 30%, rgba(255,145,0,1) 60%, rgba(166,0,255,0.8) 100%)',
                'background-color': kdr <= 2.5 ? levelColor[Math.round( kdr * 10 )] + 'cc' : 'initial'
              }
            } ).append( $( '<span/>', {
              'id': 'gcbooster_kdr_span',
              'text': kdr,
              'kdr': kdr,
              'css': { 'width': '100%', 'font-size': '10px' }
            } ) );

            $element.prepend( $kdrElement );
            $element.find( 'div.LobbyPlayer' ).append( '<style>.LobbyPlayer:before{top:15px !important;}</style>' );
          }
        } );
    }
  } );
    // monitora o documento inteiro
  observer.observe( document.body, { childList: true, subtree: true } );
};

// Limpa o cache a cada 2 dias se o TTL for menor q 'agora'
const limparCache = async ( cacheToClear, tempoDeCache ) => {
  const ultimaLimpezaCache = await getFromStorage( `ultimaLimpeza${cacheToClear}` );
  if ( !ultimaLimpezaCache || ultimaLimpezaCache < Date.now() - tempoDeCache ) {
    const cache = await getFromStorage( cacheToClear ) || {};
    for ( const [ id, obj ] of Object.entries( cache ) ) {
      if ( obj.ttl <= Date.now() ) {
        delete cache[id];
      }
    }
    await setStorage( cacheToClear, cache );
    await setStorage( `ultimaLimpeza${cacheToClear}`, Date.now() );
  }
};

function getKdrFromTitle( title ) {
  const regexp = /KDR:\s+(\d+\.\d+)\s/g;
  return Array.from( title.matchAll( regexp ), m => m[1] )[0];
}

const fetchKdr = async id => {
  // Limpa o cache
  await limparCache( 'kdrCache', 20 * 60 * 1000 ); // 20 minutos

  const kdrCache = await getFromStorage( 'kdrCache' ) || {};

  if ( kdrCache?.[id]?.ttl > Date.now() ) {
    return kdrCache[id].kdr;
  }

  const resposta = await fetch( `https://gamersclub.com.br/api/box/history/${id}`, {
    headers
  } );
  const dadosHistoryBox = await resposta.json();

  const kdr = dadosHistoryBox?.stat[0]?.value;

  kdrCache[id] = {
    kdr,
    // 20min de ttl
    ttl: Date.now() + ( 20 * 60 * 1000 )
  };
  await setStorage( 'kdrCache', kdrCache );

  return kdr;
};

export const mostrarKdrSalaIntervaler = () => {
  setInterval( () => {
    $( '[class^=LobbyPlayerHorizontal]' ).each( ( _, player ) => {
      ( async () => {
        const kdrInfos = $( player ).find( '.LobbyPlayerHorizontal__kdr' );
        const kdrValue = kdrInfos.text().split( 'KDR' )[1];
        kdrInfos.attr( 'title', `[GC Booster]: KDR médio: ${kdrValue}` );
        kdrInfos.addClass( 'draw-orange' );
        kdrInfos.css( {
          'background': kdrValue <= 2.5 ? '' :
            'linear-gradient(135deg, rgba(0,255,222,0.8) 0%, rgba(245,255,0,0.8) 30%, rgba(255,145,0,1) 60%, rgba(166,0,255,0.8) 100%)',
          'background-color': kdrValue <= 2.5 ? levelColor[Math.round( kdrValue * 10 )] + 'cc' : 'initial'
        } );
      } )();
    } );

  }, 1500 );
};

export const mostrarKdrRanked = () => {
  const kdrRankedInterval = setInterval( () => {
    $( '[class^=PlayerCardWrapper] [id^=trigger-]' ).each( ( _, element ) => {
      ( async () => {
        const playerId = String( element.id ).split( '-' ).pop();
        const wrapper = $( element ).closest( '[class^=PlayerCardWrapper]' );

        $( '.PlayerIdentityBadges', wrapper ).append( '<div class="WasdTooltip__wrapper PlayerIdentityBadges__KDR"></div>' );
        const kdrDiv = $( '.PlayerIdentityBadges__KDR', wrapper );

        const kdr = await fetchKdr( playerId );
        const playerKdr = parseFloat( kdr ).toFixed( 2 );

        const colorKrdDefault = playerKdr <= 2 ? '#000' :
          'linear-gradient(135deg, rgba(0,255,222,0.8) 0%, rgba(245,255,0,0.8) 30%, rgba(255,145,0,1) 60%, rgba(166,0,255,0.8) 100%)';
        const colorKdr = playerKdr <= 2 ? levelColor[Math.round( playerKdr * 10 )] : colorKrdDefault;

        kdrDiv.css( {
          backgroundColor: colorKdr,
          fontSize: '12px',
          textAlign: 'center',
          width: '2rem',
          height: '1.5rem',
          marginLeft: '4px',
          order: 7
        } ).text( playerKdr );
      } )();
    } );

    if ( $( '[class^=PlayerCardWrapper] [id^=trigger-]' ).length > 0 ) {
      clearInterval( kdrRankedInterval );
    }
  }, 1500 );
};

// Example playerInfo
// [ {
//   infoPlayer: {
//     'avatar': 'https://static.gamersclub.com.br/players/avatar/2230397/2230397_full.jpg',
//     'countryFlag': 'https://gcv1-assets.gamersclub.com.br/assets/images/flags/br.png',
//     'currentMonthMatchesHistory': {
//       'loss': 8,
//       'matches': 13,
//       'wins': 5
//     },
//     'currentSeasonPosition': 0,
//     'featuredMedal': {
//       'color': '',
//       'id': '1299',
//       'image': 'https://gcv1-assets.gamersclub.com.br/images/medalhas/1299.png',
//       'name': 'O Rei do Level 21 - Eu joguei'
//     },
//     'isCalibrating': false,
//     'isMajorPlayer': false,
//     'isMuted': 0,
//     'isOfficial': false,
//     'isPrime': true,
//     'level': 15,
//     'mainRole': {
//       'gaming_role_id': '4',
//       'role': 'entry_fragger',
//       'role_order': '1'
//     },
//     'name': 'Jully Pocca',
//     'playerFrame': 'https://assets.gamersclub.com.br/marketplace/avatar-frame-pixel-geek',
//     'playerId': '2230397',
//     'playerNick': '@jully.poca',
//     'stats': [
//       {
//         'stat': 'KDR',
//         'value': '0.73'
//       },
//       {
//         'stat': 'ADR',
//         'value': 70
//       },
//       {
//         'stat': 'KAST%',
//         'value': '65%'
//       }
//     ],
//     'streaming': null,
//     'subscription': 'plus',
//     'verified': false
//   },
//   ttl: 1749963468500
// } ];
