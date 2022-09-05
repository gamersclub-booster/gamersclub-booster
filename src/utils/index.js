import pt from '../translations/pt.json';
import en from '../translations/en.json';
import es from '../translations/es.json';
import fr from '../translations/fr.json';

export const getAllStorageSyncData = () => {
  return new Promise( ( resolve, reject ) => {
    chrome.storage.sync.get( null, items => {
      if ( chrome.runtime.lastError ) {
        return reject( chrome.runtime.lastError );
      }
      resolve( items );
    } );
  } );
};

export const getTranslationText = ( language, jsonKey ) => {
  const translations = {
    'pt': pt,
    'en': en,
    'es': es,
    'fr': fr
  };

  const translation = translations[language];
  const text = translation[jsonKey];

  return text || 'pt';
};
