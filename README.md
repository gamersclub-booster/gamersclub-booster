<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-18-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

# REFERENTE AO ACESSO AO DISCORD:

Foi adicionado permissão nova pra poder enviar pro webhook, só vai ser utilizado SE vc configurar o webhook, foi a única forma que encontramos, pode checar o manifest e ver que pede apenas acesso a discord.com/apis/webhooks, nada muito invasivo e bem restrito.

Infelizmente o navegador bloqueia a request sem isso!

O código está aberto e está aqui no github e os builds são automáticos, não tem alteração entre o que está lá e o que está nas lojas (chrome/firefox)
Aqui está a permissão, que é bem restrita aos webhooks: https://github.com/gamersclub-booster/gamersclub-booster/blob/development/manifest.json#L15
E só é utilizado caso você mesmo configure um webhook!



#### Links úteis:
[link-chrome]: https://chrome.google.com/webstore/detail/gamersclub-booster/dahnmmlhchpmmlgebpkpaofbefjdlpin 'Version published on Chrome Web Store'
[link-firefox]: https://addons.mozilla.org/pt-BR/firefox/addon/gamersclub-booster/ 'Version published on Mozilla Add-ons'

[<img src="https://raw.githubusercontent.com/alrra/browser-logos/90fdf03c/src/chrome/chrome.svg" width="48" alt="Chrome" valign="middle">][link-chrome] [<img valign="middle" src="https://img.shields.io/chrome-web-store/v/dahnmmlhchpmmlgebpkpaofbefjdlpin.svg?label=%20">][link-chrome] também compativel com [<img src="https://raw.githubusercontent.com/alrra/browser-logos/90fdf03c/src/edge/edge.svg" width="24" alt="Edge" valign="middle">][link-chrome] [<img src="https://raw.githubusercontent.com/alrra/browser-logos/90fdf03c/src/opera/opera.svg" width="24" alt="Opera" valign="middle">][link-chrome]

[<img src="https://raw.githubusercontent.com/alrra/browser-logos/90fdf03c/src/firefox/firefox.svg" width="48" alt="Firefox" valign="middle">][link-firefox] [<img valign="middle" src="https://img.shields.io/amo/v/gamersclub-booster.svg?label=%20">][link-firefox]

* [Video explicativo sobre a extensão](https://youtu.be/nmxw6xjsIjc)

* [Como instalar no Microsoft EDGE e no Opera](https://youtu.be/rELLprJ15ug)

## GamersClub Booster é uma extensão com o intuito de melhorar a plataforma.
![linguagem](https://user-images.githubusercontent.com/5823077/174089173-054fea38-c8f2-4fa2-b07c-2c0ba6dd7c85.jpg)
### O que ela faz?

- Geral
  - Adiciona o quanto falta para você upar ou cair, suas informações básicas (como nick e foto), rating atual e KDR médio na parte inferior central da tela <br>
    <h5> Obs: Agora você pode consultar essas informações em qualquer lugar dentro da plataforma da GamersClub! </h5>
  
    ![info-pontos](https://img001.prntscr.com/file/img001/huU_02wzQnuof9WR-kQsrA.png)
    
  - Darkmode para todo a GC para o pessoal que joga no escuro.

    ![darkmode](https://img001.prntscr.com/file/img001/pa_tRmTqTXmAUivL0fWZcQ.png)

- Página Minhas Partidas
  - Verifica em cada partida se tem jogador banido
    - Icone :warning: caso tenha algum jogador banido
    - Icone ✔️ caso nenhum jogador tenha sido banido

    ![Banidos](https://img001.prntscr.com/file/img001/D5DRnkVSRlqm0BkqzPQTAw.png)

    - Adiciona um background com cores para vitória/derrota e empate
    
    ![image](https://user-images.githubusercontent.com/1070818/108914631-661f2600-760a-11eb-9182-d98a2ef9beb5.png)

- Lista de partidas do time  
  - Adiciona um Botão para revelar o mapa que foi jogado.
  ![image](https://user-images.githubusercontent.com/1070818/107768870-dc23b300-6d15-11eb-9499-c32a7fdd732b.png)

- Lobby/Ranked  
  - Pré Ready Automático
  - Ready Automático
  - Copiar IP Automático
  - Opção de manter o lobby em posição fixa na tela. Evita aquele comportamento chato de ficar sumindo e aparecendo a aba do lobby.
  - Pré vetos
  - Adiciona um botão pra forçar a criação da lobby (pra quando tem mais do que o limite, 50 free ou 400 premium)
  - Completar partida automaticamente
  - Filtrar lobbies por país
 
  ![filtros](https://img001.prntscr.com/file/img001/C8R_8BhzRWOu6Ojw3fSfdg.png)
  - KDR na no lobby

    ![kdr-1](https://img001.prntscr.com/file/img001/U-t4M_AbQsGSpraSRw6Nlg.png)

  - KDR na sala de espera

    ![kdr](https://img001.prntscr.com/file/img001/RDXWnGZ4SUeil1XaOeWs1Q.png)

- Perfil
  - Adiciona a soma de todas as vitórias / derrotas / partidas e win rate*
  - Adiciona a contagem de kills, mortes, diferença entre kill/morte* e o KDR médio* do mês atual
    <h5>*Colorido conforme desempenho do jogador</h5>
  
    ![image](https://img001.prntscr.com/file/img001/261AjPwLTf2BAIfsU0Ij_Q.png)
  
- Integração com Discord
  - Envia automáticamente o link no Discord cadastrado (passo a passo de como fazer em seguida)
  - Envia para o Discord informações sobre a sala (Nível e KD dos jogadores, sequência de vitórias do Admin da sala, pré vetos e se a sala é aberta ou privada)

    ![discord](https://user-images.githubusercontent.com/5823077/174089159-632cba3f-7cda-43f3-975c-97df2bd7de52.jpg)

    ![discord-send](https://user-images.githubusercontent.com/5823077/174089163-0927db20-ad82-4800-aa1c-5e05f794eb70.jpg)

    ![discord-lobby](https://user-images.githubusercontent.com/5823077/174089161-27be6d4b-d794-40cc-8c6e-1851cb37232c.jpg)

    ![discordsala](https://user-images.githubusercontent.com/5823077/174089162-2b845f20-168e-4fea-bd16-32f5d42eaa16.jpg)


#### Para solicitar/colaborar com uma feature abra um Pull Request ou Issue

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center"><a href="https://github.com/henriquelbsouza"><img src="https://avatars.githubusercontent.com/u/1070818?v=4?s=100" width="100px;" alt="Henrique Lauro Bagio de Souza"/><br /><sub><b>Henrique Lauro Bagio de Souza</b></sub></a><br /><a href="https://github.com/gamersclub-booster/gamersclub-booster/issues?q=author%3Ahenriquelbsouza" title="Bug reports">🐛</a> <a href="https://github.com/gamersclub-booster/gamersclub-booster/commits?author=henriquelbsouza" title="Code">💻</a> <a href="#maintenance-henriquelbsouza" title="Maintenance">🚧</a> <a href="#mentoring-henriquelbsouza" title="Mentoring">🧑‍🏫</a></td>
      <td align="center"><a href="https://github.com/jvdavim"><img src="https://avatars.githubusercontent.com/u/16657663?v=4?s=100" width="100px;" alt="João Victor Davim"/><br /><sub><b>João Victor Davim</b></sub></a><br /><a href="https://github.com/gamersclub-booster/gamersclub-booster/issues?q=author%3Ajvdavim" title="Bug reports">🐛</a> <a href="https://github.com/gamersclub-booster/gamersclub-booster/commits?author=jvdavim" title="Code">💻</a> <a href="#maintenance-jvdavim" title="Maintenance">🚧</a></td>
      <td align="center"><a href="https://github.com/RobertaMelo"><img src="https://avatars.githubusercontent.com/u/31969450?v=4?s=100" width="100px;" alt="Roberta Melo"/><br /><sub><b>Roberta Melo</b></sub></a><br /><a href="https://github.com/gamersclub-booster/gamersclub-booster/commits?author=RobertaMelo" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/lucianocarvalho"><img src="https://avatars.githubusercontent.com/u/14339481?v=4?s=100" width="100px;" alt="Luciano Carvalho"/><br /><sub><b>Luciano Carvalho</b></sub></a><br /><a href="#design-lucianocarvalho" title="Design">🎨</a></td>
      <td align="center"><a href="https://github.com/davidhirle"><img src="https://avatars.githubusercontent.com/u/51386047?v=4?s=100" width="100px;" alt="davidhirle"/><br /><sub><b>davidhirle</b></sub></a><br /><a href="https://github.com/gamersclub-booster/gamersclub-booster/issues?q=author%3Adavidhirle" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/matleal"><img src="https://avatars.githubusercontent.com/u/58441113?v=4?s=100" width="100px;" alt="matleal"/><br /><sub><b>matleal</b></sub></a><br /><a href="https://github.com/gamersclub-booster/gamersclub-booster/commits?author=matleal" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/KINZs"><img src="https://avatars.githubusercontent.com/u/48375198?v=4?s=100" width="100px;" alt="Bruno Faboci"/><br /><sub><b>Bruno Faboci</b></sub></a><br /><a href="https://github.com/gamersclub-booster/gamersclub-booster/commits?author=KINZs" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/totinato"><img src="https://avatars.githubusercontent.com/u/56313687?v=4?s=100" width="100px;" alt="totinato"/><br /><sub><b>totinato</b></sub></a><br /><a href="https://github.com/gamersclub-booster/gamersclub-booster/issues?q=author%3Atotinato" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/ozkcs"><img src="https://avatars.githubusercontent.com/u/35303121?v=4?s=100" width="100px;" alt="ozkcs"/><br /><sub><b>ozkcs</b></sub></a><br /><a href="https://github.com/gamersclub-booster/gamersclub-booster/commits?author=ozkcs" title="Code">💻</a> <a href="https://github.com/gamersclub-booster/gamersclub-booster/issues?q=author%3Aozkcs" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://average.digital"><img src="https://avatars.githubusercontent.com/u/11398105?v=4?s=100" width="100px;" alt="Felipe Rugai"/><br /><sub><b>Felipe Rugai</b></sub></a><br /><a href="https://github.com/gamersclub-booster/gamersclub-booster/commits?author=feliperugai" title="Code">💻</a> <a href="#design-feliperugai" title="Design">🎨</a></td>
      <td align="center"><a href="http://babrauskas.dev"><img src="https://avatars.githubusercontent.com/u/19313864?v=4?s=100" width="100px;" alt="Federico Babrauskas"/><br /><sub><b>Federico Babrauskas</b></sub></a><br /><a href="https://github.com/gamersclub-booster/gamersclub-booster/issues?q=author%3Afedebabrauskas" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/leandroribeir0"><img src="https://avatars.githubusercontent.com/u/62257278?v=4?s=100" width="100px;" alt="Leandro Ribeiro"/><br /><sub><b>Leandro Ribeiro</b></sub></a><br /><a href="https://github.com/gamersclub-booster/gamersclub-booster/commits?author=leandroribeir0" title="Code">💻</a></td>
      <td align="center"><a href="http://nilkesede.sh"><img src="https://avatars.githubusercontent.com/u/1965127?v=4?s=100" width="100px;" alt="Nil Késede"/><br /><sub><b>Nil Késede</b></sub></a><br /><a href="https://github.com/gamersclub-booster/gamersclub-booster/commits?author=nilkesede" title="Code">💻</a> <a href="https://github.com/gamersclub-booster/gamersclub-booster/issues?q=author%3Anilkesede" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/Skyy4"><img src="https://avatars.githubusercontent.com/u/47400940?v=4?s=100" width="100px;" alt="Jimmy L."/><br /><sub><b>Jimmy L.</b></sub></a><br /><a href="#translation-Skyy4" title="Translation">🌍</a> </td>
    </tr>
    <tr>
      <td align="center"><a href="http://jorgebrunetto.com.br"><img src="https://avatars.githubusercontent.com/u/5823077?v=4?s=100" width="100px;" alt="Jorge Brunetto"/><br /><sub><b>Jorge Brunetto</b></sub></a><br /><a href="https://github.com/gamersclub-booster/gamersclub-booster/commits?author=jorgebrunetto" title="Code">💻</a> <a href="#design-jorgebrunetto" title="Design">🎨</a> <a href="https://github.com/gamersclub-booster/gamersclub-booster/issues?q=author%3Ajorgebrunetto" title="Bug reports">🐛</a> <a href="#maintenance-jorgebrunetto" title="Maintenance">🚧</a></td>
      <td align="center"><a href="https://github.com/dchueri"><img src="https://avatars.githubusercontent.com/u/84249430?v=4?s=100" width="100px;" alt="Diego Chueri"/><br /><sub><b>Diego Chueri</b></sub></a><br /><a href="https://github.com/gamersclub-booster/gamersclub-booster/commits?author=dchueri" title="Documentation">📖</a></td>
      <td align="center"><a href="https://github.com/barbozafernando"><img src="https://avatars.githubusercontent.com/u/45888984?v=4?s=100" width="100px;" alt="Fernando Barboza"/><br /><sub><b>Fernando Barboza</b></sub></a><br /><a href="#translation-barbozafernando" title="Translation">🌍</a> <a href="https://github.com/gamersclub-booster/gamersclub-booster/commits?author=barbozafernando" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/EMathioni"><img src="https://avatars.githubusercontent.com/u/78946931?v=4?s=100" width="100px;" alt="Eduardo Mathioni"/><br /><sub><b>Eduardo Mathioni</b></sub></a><br /><a href="https://github.com/gamersclub-booster/gamersclub-booster/commits?author=EMathioni" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
