import { GC_URL, headers, levelColor } from '../../lib/constants';
import { getFromStorage, setStorage } from '../../lib/storage';

const checkContext = () => {
  return typeof chrome !== 'undefined' && chrome.runtime && !!chrome.runtime.id;
};

const getSyncStorage = keys => {
  return new Promise( resolve => {
    if ( !checkContext() ) {
      resolve( {} );
      return;
    }
    try {
      chrome.storage.sync.get( keys, resolve );
    } catch ( _e ) {
      resolve( {} );
    }
  } );
};

const resolveVanityUrl = async vanityName => {
  if ( !checkContext() ) { return null; }
  const { steamApiKey } = await getSyncStorage( [ 'steamApiKey' ] );
  if ( !steamApiKey ) { return null; }

  return new Promise( resolve => {
    if ( !checkContext() ) { resolve( null ); return; }
    try {
      chrome.runtime.sendMessage( {
        action: 'fetchSteam',
        url: `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${steamApiKey}&vanityurl=${vanityName}`
      }, response => {
        if ( chrome.runtime.lastError ) {
          resolve( null );
        } else if ( response && response.success && response.data?.response?.success === 1 ) {
          resolve( response.data.response.steamid );
        } else {
          resolve( null );
        }
      } );
    } catch ( _e ) {
      resolve( null );
    }
  } );
};

const getSteamId = async playerId => {
  if ( !checkContext() ) { return null; }
  const cache = await getFromStorage( 'steamIdCache' ) || {};
  if ( cache[playerId] && cache[playerId].ttl > Date.now() ) {
    return cache[playerId].steamId;
  }

  try {
    // Fetch the player profile HTML — the Steam link is present in the static HTML
    const response = await fetch( `https://${GC_URL}/jogador/${playerId}` );
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString( html, 'text/html' );
    const steamLink = doc.querySelector( 'a[href*="steamcommunity.com"]' );
    if ( !steamLink ) { return null; }

    const href = steamLink.href;
    let steamId = null;
    if ( href.includes( '/profiles/' ) ) {
      steamId = href.split( '/profiles/' )[1].split( '/' )[0].trim();
    } else if ( href.includes( '/id/' ) ) {
      const vanityName = href.split( '/id/' )[1].split( '/' )[0].trim();
      steamId = await resolveVanityUrl( vanityName );
    }

    if ( steamId ) {
      cache[playerId] = { steamId, ttl: Date.now() + ( 7 * 24 * 60 * 60 * 1000 ) }; // 7 days
      if ( checkContext() ) { await setStorage( 'steamIdCache', cache ); }
    }
    return steamId;
  } catch ( err ) {
    console.error( '[GCB] Error fetching Steam ID for player', playerId, err );
    return null;
  }
};


const fetchCS2Hours = async playerId => {
  if ( !checkContext() ) { return null; }
  const { steamHours } = await getSyncStorage( [ 'steamHours' ] );
  if ( !steamHours ) { return null; }

  const { steamApiKey } = await getSyncStorage( [ 'steamApiKey' ] );
  if ( !steamApiKey ) { return null; }

  const cache = await getFromStorage( 'steamHoursCache' ) || {};
  if ( cache[playerId] && cache[playerId].ttl > Date.now() ) {
    return cache[playerId].hours;
  }

  const steamId = await getSteamId( playerId );
  if ( !steamId ) { return 'private'; }

  return new Promise( resolve => {
    if ( !checkContext() ) { resolve( 'private' ); return; }
    try {
      chrome.runtime.sendMessage( {
        action: 'fetchSteam',
        url: `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${steamApiKey}&steamid=${steamId}&format=json`
      }, async response => {
        if ( chrome.runtime.lastError ) {
          resolve( 'private' );
        } else if ( response && response.success && response.data?.response?.games ) {
          const cs2Game = response.data.response.games.find( g => g.appid === 730 );
          const hours = cs2Game ? Math.round( cs2Game.playtime_forever / 60 ) : 0;

          cache[playerId] = { hours, ttl: Date.now() + ( 24 * 60 * 60 * 1000 ) }; // 24 hours cache
          if ( checkContext() ) {
            await setStorage( 'steamHoursCache', cache );
          }
          resolve( hours );
        } else {
          resolve( 'private' );
        }
      } );
    } catch ( _e ) {
      resolve( 'private' );
    }
  } );
};

const formatHours = hours => {
  if ( typeof hours === 'number' ) {
    if ( hours >= 1000 ) {
      return ( hours / 1000 ).toFixed( 1 ).replace( '.0', '' ) + 'k h';
    }
    return hours + 'h';
  }
  if ( hours === 'private' ) { return 'Privado'; }
  return null;
};

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
          } );

          const $span = $( '<span/>', {
            'id': 'gcbooster_kdr_span',
            'gcbooster_kdr_lobby': lobbyId,
            'text': kdr,
            'css': { 'width': '100%', 'font-size': '10px' }
          } );
          $span.attr( 'data-kdr', kdr );
          $span.attr( 'data-state', 'kdr' );

          $kdrElement.append( $span );

          $kdrElement.css( 'cursor', 'pointer' );
          $kdrElement.on( 'click', function ( e ) {
            e.preventDefault();
            e.stopPropagation();
            const current = $span.attr( 'data-state' ) || 'kdr';
            if ( current === 'kdr' ) {
              $span.text( $span.attr( 'data-hours' ) || '...' );
              $span.attr( 'data-state', 'hours' );
            } else {
              $span.text( $span.attr( 'data-kdr' ) );
              $span.attr( 'data-state', 'kdr' );
            }
          } );

          ( async () => {
            const playerId = $element.attr( 'href' )?.split( '/' ).pop();
            if ( playerId ) {
              const hours = await fetchCS2Hours( playerId );
              const formatted = formatHours( hours );
              if ( formatted ) {
                $span.attr( 'data-hours', formatted );
              } else {
                $span.attr( 'data-hours', 'N/A' );
              }
            }
          } )();

          $element.prepend( $kdrElement );
          $element.find( 'div.LobbyPlayer' ).append( '<style>.LobbyPlayer:before{top:15px !important;}</style>' );
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

  const respostaPlayer = await fetch( `https://${GC_URL}/api/player-card/${id}`, {
    headers
  } );

  const dadosPlayer = await respostaPlayer.json();
  const infoPlayer = dadosPlayer;

  infoPlayerCache[id] = {
    infoPlayer,
    // TTL 20 min
    ttl: Date.now() + ( 20 * 60 * 1000 )
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
            } );

            const $span = $( '<span/>', {
              'id': 'gcbooster_kdr_span',
              'text': kdr,
              'css': { 'width': '100%', 'font-size': '10px' }
            } );
            $span.attr( 'data-kdr', kdr );
            $span.attr( 'data-state', 'kdr' );

            $kdrElement.append( $span );

            $kdrElement.css( 'cursor', 'pointer' );
            $kdrElement.on( 'click', function ( e ) {
              e.preventDefault();
              e.stopPropagation();
              const current = $span.attr( 'data-state' ) || 'kdr';
              if ( current === 'kdr' ) {
                $span.text( $span.attr( 'data-hours' ) || '...' );
                $span.attr( 'data-state', 'hours' );
              } else {
                $span.text( $span.attr( 'data-kdr' ) );
                $span.attr( 'data-state', 'kdr' );
              }
            } );

            ( async () => {
              const playerId = $element.attr( 'href' )?.split( '/' ).pop();
              if ( playerId ) {
                const hours = await fetchCS2Hours( playerId );
                const formatted = formatHours( hours );
                if ( formatted ) {
                  $span.attr( 'data-hours', formatted );
                } else {
                  $span.attr( 'data-hours', 'N/A' );
                }
              }
            } )();

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

export const mostrarKdrRanked = () => {
  const kdrRankedInterval = setInterval( () => {
    if ( !checkContext() ) {
      clearInterval( kdrRankedInterval );
      return;
    }
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
          width: 'auto',
          minWidth: '2rem',
          padding: '0 4px',
          height: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: '4px',
          order: 7,
          cursor: 'pointer'
        } ).text( playerKdr );

        kdrDiv.attr( 'data-kdr', playerKdr );
        kdrDiv.attr( 'data-state', 'kdr' );

        kdrDiv.on( 'click', function ( e ) {
          e.preventDefault();
          e.stopPropagation();
          const current = kdrDiv.attr( 'data-state' ) || 'kdr';
          if ( current === 'kdr' ) {
            kdrDiv.text( kdrDiv.attr( 'data-hours' ) || '...' );
            kdrDiv.attr( 'data-state', 'hours' );
          } else {
            kdrDiv.text( kdrDiv.attr( 'data-kdr' ) );
            kdrDiv.attr( 'data-state', 'kdr' );
          }
        } );

        ( async () => {
          const hours = await fetchCS2Hours( playerId );
          const formatted = formatHours( hours );
          if ( formatted ) {
            kdrDiv.attr( 'data-hours', formatted );
          } else {
            kdrDiv.attr( 'data-hours', 'N/A' );
          }
        } )();
      } )();
    } );

    if ( $( '[class^=PlayerCardWrapper] [id^=trigger-]' ).length > 0 ) {
      clearInterval( kdrRankedInterval );
    }
  }, 1500 );
};

export const mostrarInfoPlayerIntervaler = () => {
  if ( !checkContext() ) { return; }
  chrome.storage.sync.get( [ 'autoInfoPlayer' ], function ( result ) {
    if ( chrome.runtime.lastError ) { return; }
    if ( result.autoInfoPlayer ) {
      document.body.classList.add( 'gboost-info-player' );
      const infoPlayerInterval = setInterval( () => {
        if ( !checkContext() ) {
          clearInterval( infoPlayerInterval );
          return;
        }
        $( '#integrantesLobbyShort .player' ).each( async ( _, player ) => {
          const $element = $( player );

          if ( $element.attr( 'id' ) === undefined || $element.attr( 'id' ) === '' ) {
            const $nodeChildren = $element.find( '.LobbyPlayerHorizontal__nickname' );

            const kdrInfos = $element.find( '.LobbyPlayerHorizontal__kdr' );
            const kdrValue = kdrInfos.text().split( 'KDR' )[1];

            const playerLink = $nodeChildren.children( 'a' ).attr( 'href' );
            const playerId = playerLink?.split( '/' ).pop() ;
            $element.attr( 'id', `gcboost-content-${playerId}` );

            await getPlayerInfo( playerId ).then( async infoPlayer => {
              const completeUrl = getUrlFlag( infoPlayer?.countryFlag );
              const flagImg = `<img src="${completeUrl}" id="gcb-flag-${playerId}" alt="Flag" class="gcboost-flag b-lazy">`;
              const playerWins = infoPlayer?.currentMonthMatchesHistory?.wins || 0;
              const playerLoss = infoPlayer?.currentMonthMatchesHistory?.loss || 0;

              const colorKrdDefault = kdrValue <= 2 ? '#000' :
                'linear-gradient(135deg, rgba(0,255,222,0.8) 0%, rgba(245,255,0,0.8) 30%, rgba(255,145,0,1) 60%, rgba(166,0,255,0.8) 100%)';
              const colorKdr = kdrValue <= 2 ? levelColor[Math.round( kdrValue * 10 )] : colorKrdDefault;

              const kdrText = kdrValue || '0.00';

              const infos = `
          <div class="gcboost-content">
            <div class="gcboost-result">
              <div class="wins">Vitórias: ${playerWins}</div>
              <div class="gcboost-kdr-color"
                title="[GC Booster]: KDR médio: ${kdrValue}"
                data-kdr="${kdrValue || '0.00'}"
                data-state="kdr"
                style="background-color: ${colorKdr}; width: auto; min-width: 40px; padding: 0 4px; cursor: pointer;">
                ${kdrText}
              </div>
              <div class="losses">Derrotas: ${playerLoss}</div>
            </div>
          </div>`;

              const $infos = $( infos );
              const $kdrBadge = $infos.find( '.gcboost-kdr-color' );
              $kdrBadge.on( 'click', function ( e ) {
                e.preventDefault();
                e.stopPropagation();
                const current = $( this ).attr( 'data-state' ) || 'kdr';
                if ( current === 'kdr' ) {
                  $( this ).text( $( this ).attr( 'data-hours' ) || '...' );
                  $( this ).attr( 'data-state', 'hours' );
                } else {
                  $( this ).text( $( this ).attr( 'data-kdr' ) );
                  $( this ).attr( 'data-state', 'kdr' );
                }
              } );

              $nodeChildren.prepend( flagImg );
              $element.append( $infos );

              ( async () => {
                const hours = await fetchCS2Hours( playerId );
                const formatted = formatHours( hours );
                if ( formatted ) {
                  $kdrBadge.attr( 'data-hours', formatted );
                } else {
                  $kdrBadge.attr( 'data-hours', 'N/A' );
                }
              } )();

            } ).catch( error => {
              console.error( 'Erro ao obter informações do jogador:', error );
            } );
          }
        } );
      }, 1000 );
    }
  } );
};

export const showKdrMatch = () => {
  const observer = new MutationObserver( () => {
    if ( !checkContext() ) {
      observer.disconnect();
      return;
    }
    $( '[id^="trigger-"]' ).each( ( _, element ) => {
      if ( element.dataset.gcboosterProcessed ) {
        return;
      }

      const $trigger = $( element );
      const triggerId = element.id; // trigger-{playerId}
      const playerId = triggerId.replace( 'trigger-', '' );

      element.dataset.gcboosterProcessed = 'true';

      ( async () => {
        const $playerListCard = $trigger.closest( '.PlayerListCard' );
        const $badges = $playerListCard.find( '.PlayerIdentityBadges' );

        const infoPlayer = await getPlayerInfo( playerId );
        const kdrStat = infoPlayer?.stats?.find( stat => stat.stat === 'KDR' );
        const playerKdr = kdrStat ? parseFloat( kdrStat.value ).toFixed( 2 ) : '0.00';

        const colorKrdDefault = playerKdr <= 2 ? '#000' :
          'linear-gradient(135deg, rgba(0,255,222,0.8) 0%, rgba(245,255,0,0.8) 30%, rgba(255,145,0,1) 60%, rgba(166,0,255,0.8) 100%)';
        const colorKdr = playerKdr <= 2 ? levelColor[Math.round( playerKdr * 10 )] : colorKrdDefault;

        const $kdrElement = $( '<div/>', {
          'id': 'gcbooster_kdr_match_' + playerId,
          'class': 'WasdTooltip__wrapper PlayerIdentityBadges__KDR',
          'css': {
            'background': colorKdr,
            'color': 'white',
            'font-weight': '600',
            'font-size': '10px',
            'padding': '2px 4px',
            'margin-top': '2px',
            'margin-left': '4px',
            'text-align': 'center',
            'display': 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            'width': 'auto',
            'min-width': '2rem',
            'cursor': 'pointer'
          },
          'title': `[GC Booster]: KDR: ${playerKdr}`,
          'text': playerKdr
        } );

        $kdrElement.attr( 'data-kdr', playerKdr );
        $kdrElement.attr( 'data-state', 'kdr' );

        $kdrElement.on( 'click', function ( e ) {
          e.preventDefault();
          e.stopPropagation();
          const current = $( this ).attr( 'data-state' ) || 'kdr';
          if ( current === 'kdr' ) {
            $( this ).text( $( this ).attr( 'data-hours' ) || '...' );
            $( this ).attr( 'data-state', 'hours' );
          } else {
            $( this ).text( $( this ).attr( 'data-kdr' ) );
            $( this ).attr( 'data-state', 'kdr' );
          }
        } );

        ( async () => {
          const hours = await fetchCS2Hours( playerId );
          const formatted = formatHours( hours );
          if ( formatted ) {
            $kdrElement.attr( 'data-hours', formatted );
          } else {
            $kdrElement.attr( 'data-hours', 'N/A' );
          }
        } )();

        const isLeftSide = $playerListCard.hasClass( 'PlayerListCard--left' );

        if ( $badges.length > 0 ) {
          $badges.append( $kdrElement );
          if ( isLeftSide ) {
            $kdrElement.css( 'order', '10' );
          } else {
            $kdrElement.css( { 'order': '-1', 'margin-left': '0', 'margin-right': '4px' } );
          }
        }
      } )();
    } );
  } );

  observer.observe( document.body, { childList: true, subtree: true } );
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
/**
 * Injeta badge clicável de horas de CS2 nos jogadores do sidebar MyRoom
 * (.LobbyPlayerHorizontal — a lista horizontal de jogadores na sala criada)
 */
export const showHoursMyRoom = () => {
  const ATTR = 'data-gcb-hours-processed';

  const processar = async $player => {
    if ( !$player.length ) { return; }

    // Evita processar duas vezes
    if ( $player.attr( ATTR ) ) { return; }
    $player.attr( ATTR, 'true' );

    // Extrai playerId via [id^="player-trigger-wrapper-"] (igual ao autoKickNegativados)
    const triggerEl = $player.find( '[id^="player-trigger-wrapper-"]' );
    let playerId = null;
    if ( triggerEl.length ) {
      const match = triggerEl.attr( 'id' ).match( /player-trigger-wrapper-(\d+)/ );
      playerId = match?.[1] || null;
    }

    // Fallback: extrai do href do nickname
    if ( !playerId ) {
      const href = $player.find( 'a[href*="/jogador/"]' ).attr( 'href' );
      playerId = href?.split( '/' ).pop() || null;
    }

    if ( !playerId ) { return; }

    // Pega o elemento nativo de KDR para ancoragem e valor
    const $kdrNativo = $player.find( '.LobbyPlayerHorizontal__kdr' );
    if ( !$kdrNativo.length ) { return; }

    const kdrRaw = $kdrNativo.text().replace( /KDR/gi, '' ).trim();
    const kdrNum = parseFloat( kdrRaw ) || 0;
    const kdrText = isNaN( kdrNum ) ? '0.00' : kdrNum.toFixed( 2 );

    const colorDefault = 'linear-gradient(135deg, rgba(0,255,222,0.8) 0%, rgba(245,255,0,0.8) 30%, rgba(255,145,0,1) 60%, rgba(166,0,255,0.8) 100%)';
    const bg = kdrNum <= 2 ? ( levelColor[Math.round( kdrNum * 10 )] || '#555' ) + 'cc' : colorDefault;

    // Cria a badge
    const $badge = $( '<div/>', {
      id: `gcb-hours-badge-${playerId}`,
      class: 'gcb-myroom-hours-badge',
      'data-kdr': kdrText,
      'data-state': 'kdr',
      title: '[GC Booster]: Clique para ver horas de CS2',
      css: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bg,
        color: '#fff',
        fontWeight: '700',
        fontSize: '11px',
        padding: '1px 6px',
        borderRadius: '3px',
        cursor: 'pointer',
        marginLeft: '4px',
        minWidth: '34px',
        height: '18px',
        userSelect: 'none',
        flexShrink: 0
      }
    } ).text( kdrText );

    // Toggle KDR ↔ Horas ao clicar
    $badge.on( 'click', function ( e ) {
      e.preventDefault();
      e.stopPropagation();
      const state = $( this ).attr( 'data-state' ) || 'kdr';
      if ( state === 'kdr' ) {
        $( this ).text( $( this ).attr( 'data-hours' ) || '...' );
        $( this ).attr( 'data-state', 'hours' );
      } else {
        $( this ).text( $( this ).attr( 'data-kdr' ) );
        $( this ).attr( 'data-state', 'kdr' );
      }
    } );

    // Insere a badge imediatamente após o KDR nativo
    $kdrNativo.after( $badge );

    // Busca as horas de CS2 em background
    ( async () => {
      if ( !checkContext() ) { return; }
      const hours = await fetchCS2Hours( playerId );
      const formatted = formatHours( hours );
      $badge.attr( 'data-hours', formatted || 'N/A' );
    } )();
  };

  const scan = () => {
    $( '.LobbyPlayerHorizontal' ).each( ( _, el ) => processar( $( el ) ) );
  };

  // Observer para pegar jogadores que entram na sala depois
  const observer = new MutationObserver( () => {
    if ( !checkContext() ) { observer.disconnect(); return; }
    scan();
  } );

  observer.observe( document.body, { childList: true, subtree: true } );
  scan(); // processa jogadores já presentes
};


