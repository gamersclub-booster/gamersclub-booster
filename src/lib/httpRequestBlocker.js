// Função que transforma uma string em um número inteiro positivo
// (assim podemos passar uma string como id para o chrome.declarativeNetRequest.updateDynamicRules)
function stringToId( str ) {
  let hash = 0;
  for ( let i = 0; i < str.length; i++ ) {
    hash += str.charCodeAt( i ) * ( i + 1 );
    hash = hash % 1000000; // Mantém o número dentro de um limite para evitar overflow
  }
  return hash;
}

const getBlockList = async () => {
  return new Promise( resolve => {
    chrome.declarativeNetRequest.getDynamicRules( null, rules => {
      resolve( rules );
    } );
  } );
};


export const addUrlToBlockList = async ( url, ruleName ) => {
  const blockList = await getBlockList();
  const id = stringToId( ruleName );

  if ( blockList.some( rule => rule.id === id ) ) { return; }

  chrome.declarativeNetRequest.updateDynamicRules( {
    addRules: [
      {
        id,
        priority: 1,
        action: { type: 'block' },
        condition: { urlFilter: url }
      }
    ],
    removeRuleIds: []
  } );
};

export const removeUrlFromBlockList = async ruleName => {
  const blockList = await getBlockList();
  const id = stringToId( ruleName );

  if ( !blockList.some( rule => rule.id === id ) ) { return; }

  chrome.declarativeNetRequest.updateDynamicRules( {
    addRules: [],
    removeRuleIds: [ id ]
  } );
};
