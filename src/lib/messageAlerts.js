import { isFirefox } from '../lib/constants';

export function alertaMsg( msg ) {
  if ( isFirefox ) {
    window.wrappedJSObject.errorAlert( msg );
  } else {
    // Essa linha ta bloqueada, antes mostrava a msg certinho no padrão da GC, com o toaster lá no canto... n faço ideia de como resolver
    // location.href = `javascript:errorAlert('${msg}'); void 0`;
    window.alert( msg ); // esse alerta é uma merda.
  }
}
