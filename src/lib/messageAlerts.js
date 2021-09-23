import { isFirefox } from '../lib/constants';

export function alertaMsg( msg ) {
  const cfgNoty = {
    'text': msg,
    'layout': 'center',
    'theme': 'relax',
    'dismissQueue': true,
    'timeout': 5000,
    'type': 'success',
    'animation': {
      'open': 'animated bounceInRight',
      'close': 'animated bounceOutRight'
    }
  };
  const cfgNotyStr = JSON.stringify( cfgNoty );
  const jqueryString = '$("#noty_center_layout_container").css("z-index",99999999999)';
  const stringToPass = 'javascript:function successAlert(msg){ noty(' + cfgNotyStr + ');' + jqueryString + ';};successAlert("' + msg + '"); void 0';
  if ( isFirefox ) {
    window.wrappedJSObject.errorAlert( msg );
  } else {
    location.href = stringToPass;
  }
}
