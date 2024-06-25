export const autoDarkMode = () => {
  $( '.lobby-panel-content-info, .LobbyHeader, .Topbar__freeBg, #lobby-rooms-page' ).css( 'background', 'black' );
  $( '.GamersClubCSApp, .GamersClubApp, .LobbyHeader, .MainHeader' ).css( 'background', 'black' );
  $( '.MainHeader__logo, .footer, .no-padding.sitemap, body, .SettingsMenu, .gcf-room-list-scroll' ).css( 'background', 'black' );
  $( '.body-page, .home-secondary, .panel-content-info, .GamersClubCSApp > div, .gcf-menu' ).css( 'background', 'black' );
};
