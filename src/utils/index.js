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

export const waitForElement = selector => {
  return new Promise( res => {
    if ( document.querySelector( selector ) ) { return res( document.querySelector( selector ) ); }

    const observer = new MutationObserver( () => {
      if ( document.querySelector( selector ) ) {
        observer.disconnect();
        res( document.querySelector( selector ) );
      }
    } );

    observer.observe( document.body, { childList: true, subtree: true } );
  } );
};

export const getTranslationText = ( jsonKey, language ) => {
  const LOCALES = {
    'pt': pt,
    'en': en,
    'es': es,
    'fr': fr
  };

  const translation = LOCALES[language] || LOCALES.pt;
  return translation[jsonKey];
};
