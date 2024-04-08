import { isFirefox } from '../lib/constants';

export function alertaMsg( message ) {
  if ( !message || typeof message !== 'string' ) { return; }

  //  disparar o evento para o contexto da página exibir o alerta
  document.dispatchEvent( new CustomEvent( 'gc-booster:alert', { detail: { message, isFirefox } } ) );
}
