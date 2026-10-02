import { isExtensionContextValid } from '../utils';

export const getFromStorage = async ( key, from = 'local' ) => {
  return new Promise( ( resolve, _reject ) => {
    if ( !isExtensionContextValid() ) {
      return resolve( null );
    }
    try {
      chrome.storage[from].get( key, result => {
        if ( chrome.runtime?.lastError ) {
          return resolve( null );
        }
        if ( !key ) {
          return resolve( result );
        }
        resolve( result ? result[key] : null );
      } );
    } catch ( _e ) {
      resolve( null );
    }
  } );
};

export const setStorage = async ( key, value, from = 'local' ) => {
  if ( !isExtensionContextValid() ) {
    return;
  }
  try {
    chrome.storage[from].set( { [key]: value } );
  } catch ( _e ) {
    // Context invalidated
  }
};
