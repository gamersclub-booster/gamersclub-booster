export const getFromStorage = async ( key, from = 'local' ) => {
  return new Promise( ( resolve, _reject ) => {
    chrome.storage[from].get( key, resolve );
  } ).then( result => {
    if ( !key ) { return result; } else { return result[key]; }
  } );
};

export const setStorage = async ( key, value, from = 'local' ) => {
  chrome.storage[from].set( { [key]: value } );
};
