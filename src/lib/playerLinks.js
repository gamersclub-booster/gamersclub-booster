import { resolveSteamId } from './steamIdResolver';

/**
 * Resolve apenas links de perfil (Steam, csREP) para uma lista de jogadores da GC.
 * Não faz nenhuma requisição à Steam — usa apenas o link já publicado no perfil
 * da GamersClub, então não exige nenhuma permissão de host extra na extensão.
 */
export async function getPlayerLinks( gcPlayerIds ) {
  if ( !gcPlayerIds || !Array.isArray( gcPlayerIds ) || gcPlayerIds.length === 0 ) {
    return [];
  }

  const resolvedList = [];
  for ( const id of gcPlayerIds ) {
    const res = await resolveSteamId( id );
    resolvedList.push( res );
    // Se não veio do cache (teve que fazer fetch na GC), adiciona um pequeno delay
    // para evitar Rate Limit/Cloudflare.
    if ( res && !res.fromCache ) {
      await new Promise( resolve => setTimeout( resolve, 300 ) );
    }
  }

  return gcPlayerIds.map( ( gcId, i ) => {
    const res = resolvedList[i];
    if ( !res ) {
      return { gcId, error: 'Could not resolve Steam profile link' };
    }
    return {
      gcId,
      steamId: res.steamId || null,
      steamUrl: res.rawSteamUrl || null,
      csrepUrl: res.csrepUrl || null
    };
  } );
}
