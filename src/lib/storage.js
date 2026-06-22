export const getFromStorage = async ( key, from = 'local' ) => {
  return new Promise( ( resolve, _reject ) => {
    if ( typeof chrome === 'undefined' || !chrome.storage || !chrome.storage[from] ) {
      resolve( {} );
      return;
    }
    try {
      chrome.storage[from].get( key, resolve );
    } catch ( _e ) {
      resolve( {} );
    }
  } ).then( result => {
    if ( !key ) { return result; } else { return result[key]; }
  } );
};

export const setStorage = async ( key, value, from = 'local' ) => {
  if ( typeof chrome === 'undefined' || !chrome.storage || !chrome.storage[from] ) {
    return;
  }
  try {
    chrome.storage[from].set( { [key]: value } );
  } catch ( _e ) {
    // console.warn('Could not save to storage', _e);
  }
};

