import { isFirefox } from '../lib/constants';

export function alertaMsg( msg ) {
  if ( isFirefox ) {
    window.wrappedJSObject.errorAlert( msg );
  } else {
    location.href = `javascript:errorAlert('${msg}'); void 0`;
  }
}
