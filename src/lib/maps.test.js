
import { getMapImage } from "./maps";

it ('seleciona mapas', () =>{
    expect(getMapImage('de_mirage')).toBe('https://steamuserimages-a.akamaihd.net/ugc/1822269383661554784/0F9E7C44F50C692C1EEC1FC677CFDD3EF646F205/')
})

it ('seleciona mapas', () =>{
    expect(getMapImage('de_dust2')).toBe('https://steamuserimages-a.akamaihd.net/ugc/1822269383661556277/AD44C5610063755E8F01C666BD355903233BD71A/')
})

it ('seleciona mapas', () =>{
    expect(getMapImage('de_nuke')).toBe('https://steamuserimages-a.akamaihd.net/ugc/1822269383661558001/9A12A18E071449DC606DBE0567BB73A1B152E627/')
})

it ('seleciona mapas', () =>{
    expect(getMapImage('de_vertigo')).toBe('https://www.esportelandia.com.br/wp-content/uploads/2020/01/vertigo-posicoes-0-cke.jpg?ezimgfmt=ng:webp/ngcb2')
})

it ('seleciona mapas', () =>{
    expect(getMapImage('de_train')).toBe('https://steamuserimages-a.akamaihd.net/ugc/1822269383661557181/6914D9DE513C94C61DE93F771B84087CD3A71855/') //url está igual ao da 'de_vertigo' e irá acusar uma falha
})

it ('seleciona mapas', () =>{
    expect(getMapImage('de_overpass')).toBe('https://steamuserimages-a.akamaihd.net/ugc/1822269383661555590/09F33020BF5CD1C9621BF24913667609AA24A39B/')
})

it ('seleciona mapas', () =>{
    expect(getMapImage('de_inferno')).toBe('https://steamuserimages-a.akamaihd.net/ugc/1822269383661553917/B39374DE893CD45BD9361ECF82794445F3D3C6D7/')
})

it ('seleciona mapas', () =>{
    expect(getMapImage('de_cbble_classic')).toBe('https://www.esportelandia.com.br/wp-content/uploads/2020/01/posi%C3%A7%C3%B5es-csgo-cobblestone.jpg?ezimgfmt=ng:webp/ngcb2')
})

it ('seleciona mapas', () =>{
    expect(getMapImage('de_ancient')).toBe('https://steamuserimages-a.akamaihd.net/ugc/1822269530633050395/22CAA5E07D68FB8FDA8643DDF69A58B2A388C9F6/')
})

it ('seleciona mapas', () =>{
    expect(getMapImage('de_tuscan')).toBe('https://external-preview.redd.it/vozvExNxbuYFYBP8b8Fu03mTH2y1ZJEzajAFtYTN1rA.jpg?auto=webp&s=88361088e82d5868ac26ecb522f009dd1c9bec0b')
})

it ('seleciona mapas', () =>{
    expect(getMapImage('de_anubis')).toBe('https://pbs.twimg.com/media/Fh9DINkWAAAy8sw?format=jpg&name=medium')
})

it ('seleciona mapas', () =>{
    expect(getMapImage('de_cache')).toBe('https://steamuserimages-a.akamaihd.net/ugc/1822269383661548991/2C886B2A6EAB6E266B5E84BB1039E701205A48C1/')
})