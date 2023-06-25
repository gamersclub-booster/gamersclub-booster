
import { getMapImage } from "./maps";

it ('seleciona mapas', () =>{
    expect(getMapImage('de_mirage')).toBe('https://steamuserimages-a.akamaihd.net/ugc/1822269383661554784/0F9E7C44F50C692C1EEC1FC677CFDD3EF646F205/')
})