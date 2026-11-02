import { STORAGE_KEYS } from './rules.mjs';

// The existing feature listeners write these same keys; this binding only reads.
export function bindKdrOptions( document, storage ) {
  const keys = [ STORAGE_KEYS.averageEnabled, STORAGE_KEYS.individualEnabled ];
  const onChanged = ( changes, area ) => {
    if ( area !== 'sync' ) { return; }
    for ( const key of keys ) {
      const input = document.getElementById( key );
      if ( input && Object.hasOwn( changes, key ) ) { input.checked = changes[key].newValue === true; }
    }
  };
  storage.onChanged.addListener( onChanged );
  return () => storage.onChanged.removeListener( onChanged );
}
