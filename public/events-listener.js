// ouve os eventos de alerta para disparar o alerta através do contexto
// da página para poder usar o toast da GC ao invés do alert do browser
document.addEventListener( 'gc-booster:alert', function ( event ) {
  const { message, isFirefox } = event.detail;

  if ( isFirefox ) { return window.wrappedJSObject.errorAlert( message ); }

  window.alert( message );
} );
