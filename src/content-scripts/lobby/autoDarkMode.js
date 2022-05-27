export const autoDarkMode = () =>
  chrome.storage.sync.get( [ 'autoDarkMode' ], function ( result ) {
    if ( result.autoDarkMode ) {
      $( '.lobby-panel-content-info, .LobbyHeader, .Topbar__freeBg' ).css( 'background', 'black' );
      $( '.GamersClubCSApp, .GamersClubApp, .LobbyHeader, .MainHeader' ).css( 'background', 'black' );
      $( '.MainHeader__logo, .footer, .no-padding.sitemap, body, .SettingsMenu, .gcf-room-list-scroll, .gcf-menu' ).css( 'background', 'black' );
    }
  } );

