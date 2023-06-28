import { arrayRemove } from "./arrayRemove";

//teste
describe('arrayRemove', () => {
    test('remove o valor do array corretamente', () => {
        const inputArray = [1, 2, 3, 4, 5];
        const valueToRemove = 3;
        const expectedOutput = [1, 2, 4, 5];
  
        const result = arrayRemove(inputArray, valueToRemove);
  
        expect(result).toEqual(expectedOutput);
    });
});