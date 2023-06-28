import { JSDOM } from 'jsdom';
import { retrieveWindowVariables } from './dom';

describe('Teste da função retrieveWindowVariables', () => {
  test('Retorna um objeto vazio quando não há variáveis definidas', () => {
    const variables = [];
    const expectedResult = {};

    // Configura o JSDOM
    const dom = new JSDOM('<html><body></body></html>');
    global.document = dom.window.document;

    const result = retrieveWindowVariables(variables);

    expect(result).toEqual(expectedResult);
  });
});
