import { jest } from '@jest/globals';
import { loadJson } from './blockList';
import { saveJson } from './blockList';
import { JSDOM } from 'jsdom';

describe('Chamando funções de blocklist', () => {
  it('chama a função loadJson', () => {
    //tentei utilizar o jsdom pra simular documento, agora falta algo pra simular o arquivo q tem na função
    const dom = new JSDOM('<html><body></body></html>');

    // Defina o objeto document globalmente
    global.document = dom.window.document;
    const importOrig = document.createElement( 'input');
    importOrig.id = ('importOrig');
    document.body.appendChild(importOrig);
      //criei um elemento qualquer e dei a id importOrig pro teste, e depois mockei o 'e' e o 'callback' q são chamadas da função
    const callback = jest.fn();
    //esse e aqui tem q ter alguma coisa a mais, acho q o targetfiles, mas não manjei muito como fazer ainda
    const e = jest.fn();
    loadJson(e, callback);
    const expectedResult = '';
    expect(importOrig).toEqual(expectedResult);
  });
  it('chama a função loadJson', () => {
   
  });
});


