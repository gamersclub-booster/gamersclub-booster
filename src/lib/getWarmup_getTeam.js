export function getWarmupTime( warmupexpires ) {
    if ( warmupexpires <= 0 ) { return 'Acabou!'; }
    const now = new Date();
    now.setSeconds( now.getSeconds() + warmupexpires );
    return `Até: ${now.toTimeString()}`;
  }

  export function getTeamInfo( data ) {
    const membersFull = data.players;
    const membersString = membersFull.map( function ( e ) {
      return `${e.level} - ${e.nick} \n`;
    } );
  
    return membersString.join( '' );
  }