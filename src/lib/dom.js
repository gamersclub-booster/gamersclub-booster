// Um helper para pegar a var necessaria.
export function retrieveWindowVariables( variables ) {
  const ret = {};

  let scriptContent = '';
  for ( let i = 0; i < variables.length; i++ ) {
    const currVariable = variables[i];
    scriptContent +=
      'if (typeof ' +
      currVariable +
      ' !== \'undefined\') $(\'body\').attr(\'tmp_' +
      currVariable +
      '\', ' +
      currVariable +
      ');\n';
  }

  const script = document.createElement( 'script' );
  script.id = 'tmpScript';
  script.appendChild( document.createTextNode( scriptContent ) );
  ( document.body || document.head || document.documentElement ).appendChild( script );

  for ( let i = 0; i < variables.length; i++ ) {
    const currVariable = variables[i];
    ret[currVariable] = $( 'body' ).attr( 'tmp_' + currVariable );
    $( 'body' ).removeAttr( 'tmp_' + currVariable );
  }

  $( '#tmpScript' ).remove();

  return ret;
}

export const log = msg => console.log( '[GC Booster]', msg );
