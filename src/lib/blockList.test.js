import { jest } from '@jest/globals';
import { loadJson } from './blockList';
import { JSDOM } from 'jsdom';

describe('Chamando funções de blocklist', () => {
  it('chama a função loadJson', () => {
    const dom = new JSDOM('<html><body></body></html>');

    global.document = dom.window.document;
    const importOrig = document.createElement('input');
    importOrig.id = 'importOrig';
    document.body.appendChild(importOrig);

    // Mock FileReader
    class MockFileReader {
      readAsText(file) {
        this.result = JSON.stringify(file.contents); // Convert to JSON string
        this.onload();
      }
    }
    global.FileReader = MockFileReader;

    const callback = jest.fn();
    const e = {
      target: {
        files: [{ name: 'teste.json', contents: 'teste' }]
      }
    };
    loadJson(e, callback);
    
    expect(importOrig.value).toEqual('');
    expect(callback).toHaveBeenCalledWith('teste');
  });
});
