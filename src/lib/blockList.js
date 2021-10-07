export function saveJson( obj ) {
  const myArray = JSON.stringify( obj, null, 4 );
  const vLink = document.createElement( 'a' ),
    vBlob = new Blob( [ myArray ], { type: 'octet/stream' } ),
    vName = 'configGCBooster.json',
    vUrl = window.URL.createObjectURL( vBlob );
  vLink.setAttribute( 'href', vUrl );
  vLink.setAttribute( 'download', vName );
  vLink.click();
}

export function loadJson( e, callback ) {
  const importOrig = document.getElementById( 'importOrig' );
  const files = e.target.files, reader = new FileReader();
  reader.onload = _imp;
  reader.readAsText( files[0] );
  function _imp() {
    const _myImportedData = JSON.parse( this.result );
    callback( _myImportedData );
    importOrig.value = '';
  }
}

export function adicionarNaLista( obj, callback ) {
  function atualizarArray( valor, antigo ) {
    const novo = new Array( valor );
    for ( let i = 0; i < antigo.length; ++i ) {
      novo.push( antigo[i] );
    }
    return novo;
  }
  chrome.storage.sync.get( [ 'blockList' ], function ( result ) {
    if ( result['blockList'] ) {
      const array = result['blockList'] ? result['blockList'] : [];
      const arrayNovo = array.find( e => e.id === obj.id ) ? array : atualizarArray( obj, array );
      const listaObj = {};
      listaObj['blockList'] = arrayNovo;
      chrome.storage.sync.set( listaObj, callback() );
    }
  } );
}

export function removerDaLista( obj, callbackFunc ) {
  const callback = callbackFunc ? callbackFunc : function () {};

  function removerID( arr, value ) {
    return arr.filter( function ( ele ) {
      return ele.id !== value.id;
    } );
  }
  chrome.storage.sync.get( [ 'blockList' ], function ( result ) {
    if ( result.blockList ) {
      const array = result['blockList'] ? result['blockList'] : [];
      const arrayNovo = array.find( e => e.id === obj.id ) ? removerID( array, obj ) : array;
      const listaObj = {};
      listaObj['blockList'] = arrayNovo;
      chrome.storage.sync.set( listaObj, function () {
        chrome.storage.sync.get( [ 'blockList' ], function ( result ) {
          if ( result.blockList ) {
            callback( result.blockList.length );
          }
        } );
      } );
    }
  } );
}
