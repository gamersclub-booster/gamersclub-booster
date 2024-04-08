export function getUserInfo() {
  const rawUserObject = document.documentElement.innerHTML.match( /window\.hj\('identify', userId, ({[^}]*})/ )?.[1];
  const doubleQuotedUserObject = rawUserObject.replace( /'/g, '"' );
  const userObject = JSON.parse( doubleQuotedUserObject );
  return userObject;
}

export const log = msg => console.log( '[GC Booster]', msg );
