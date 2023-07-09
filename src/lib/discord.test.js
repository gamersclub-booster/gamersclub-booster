import { getWarmupTime, getTeamInfo } from './getWarmup_getTeam';
import { JSDOM } from 'jsdom';

describe('Chamando funções do discord', () => {
    it('chama a função getWarmupTime', () => {
      const warmupexpires = 10; // Exemplo: 10 segundos
      const result = getWarmupTime(warmupexpires);
  
      expect(result).toMatch(/^Até: \d{2}:\d{2}:\d{2}/); // Verifica se o resultado está no formato esperado, ignorando o restante da string
    });
    it('chama a função getTeamInfo', () => {
      const membersFull = {
        data: {
          players: [{ level: 'teste-level', nick: 'teste-nick' }]
        }
      };
    
      const result1 = getTeamInfo(membersFull.data);
    
      expect(result1).toBe('teste-level - teste-nick \n');
    });
    
  });