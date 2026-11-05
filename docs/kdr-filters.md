# Filtros de KDR nos lobbies

A barra permite habilitar separadamente o mínimo de KDR médio e o mínimo de todos os jogadores. Ambos começam desligados, com mínimos de 1.00. Os controles aceitam ponto ou vírgula e incrementos de 0.05. A comparação é inclusiva, em duas casas: com mínimo 1.00, 0.99 reprova; 1.00 e 1.01 atendem ao requisito.

As preferências usam `chrome.storage.sync`; os toggles também são sincronizados com as opções da extensão. Após o carregamento do módulo de lobby, a aplicação acompanha alterações do DOM e navegação SPA, sem botão de atualização, polling, novas requisições ou scroll automático. A média e os badges continuam sendo apresentados quando os filtros estão desligados.

## Comparação com o comportamento anterior

| Comportamento | Implementação proposta |
|---|---|
| Faixa min/max para lobbies | Substituída por dois mínimos independentes; não há máximo no filtro novo de lobbies |
| Preferência média não definida era tratada como habilitada | Instalação nova começa com os filtros desligados; preferências explícitas são respeitadas |
| Média aritmética e indicador laranja | Preservados, com funções de apresentação extraídas do módulo original |
| Média parcial de badges conhecidos | Pode continuar visível como no original; o filtro aguarda roster completo para aprovar média derivada |
| Filtragem de desafios por média associada ao título | Mantida quando o filtro médio está ativo; respeita o máximo legado salvo abaixo de 2, com 2 significando sem teto |
| Editor do máximo legado | Slider antigo removido; não há novo editor desse máximo. A preferência salva afeta somente desafios |
| Badges individuais, perfis e funcionalidades de partida | Módulos preservados; não foi comprovada paridade completa de todos os fluxos autenticados |

A associação de desafios por título é herdada e pode ser ambígua para títulos iguais. O filtro individual não infere jogadores de um desafio por esse vínculo. Não se deve interpretar a reprovação por KDR como uma alteração da elegibilidade nativa, das restrições de nível ou do estado fechado/lotado.

## Dados e carregamento progressivo

O KDR individual é lido de fontes reconhecidas do card, sobretudo o tooltip atual do jogador. Badges derivados antigos não aprovam automaticamente um jogador substituído. Ausência não vira zero. Zero publicado é um dado válido; indicadores explícitos de carregamento mantêm a estatística desconhecida.

Skeletons não são salas avaliadas e permanecem no fluxo da página. Cards com estatísticas pendentes preservam a geometria; reprovações conhecidas são ocultadas. O resumo mostra apenas exibidas/ocultadas e fica oculto quando os filtros estão desligados. Não há promessa de avaliar salas ainda não renderizadas. A extensão não lê estado privado de React nem força o carregamento da lista.

Detalhes para desenvolvimento:

```javascript
const panel = document.getElementById('gcb-kdr-filters');
JSON.parse(panel.dataset.counts);
JSON.parse(panel.dataset.diagnostics);
```

O carregamento real depende da plataforma. Uma interação indireta entre ocultação e virtualização não pode ser descartada para todos os layouts. O teste real relatado nesta contribuição não apresentou alternância excessiva com a página parada.

## Reprodução automatizada

Use Node.js 24 e o lockfile do projeto:

```text
npm ci
npm run lint
npm test
npm run build
```

Teste opcional de navegador: instale Chromium com `npx playwright install chromium` e execute `npm run test:browser`, ou defina `GCB_BROWSER_EXECUTABLE` para um executável Chromium compatível. O teste utiliza perfil temporário e respostas sintéticas para a página; não acessa a conta autenticada. No PowerShell, pode-se usar `npm.cmd`/`npx.cmd` caso a política local bloqueie os wrappers `.ps1`.

A suíte tem 63 testes de regras/DOM e um cenário de navegador que verifica controles, SPA, persistência, progressão com IntersectionObserver, ausência da dica removida e estabilidade geométrica do contador. Inclui comparação do renderizador de médias com a base oficial e fixture explicitamente sintético com um card e um skeleton. Não inclui vídeos, capturas ou dados reais de jogadores.

## Homologação real e limites

O responsável pela contribuição realizou e aprovou pessoalmente seis verificações reais na GamersClub, usando o Opera GX, na compilação local clean.3:

1. Cintilação visual (flicker) eliminada.
2. Contador estável.
3. Filtros médio e individual funcionando.
4. Média e badges originais preservados.
5. Carregamento progressivo funcionando.
6. Nenhuma alternância excessiva de cartões com a página parada.

Na clean.4, o responsável também validou pessoalmente no Opera GX a remoção do texto explicativo redundante e a eliminação do espaço vazio no rodapé. A conferência visual dessa versão está concluída, além das validações automatizadas já registradas.

Essas confirmações abrangem as funcionalidades implementadas nos cenários descritos. Não representam testes completos de desafios, máximo legado, perfis ou de todos os fluxos de partida da plataforma.

A versão oficial do manifest/package é preservada. A identificação clean.4 pertence aos builds locais; não é uma nova versão oficial proposta no código do PR.

A referência de saída do renderizador oficial é um fixture estático com proveniência registrada. A suíte funciona sem histórico Git; não executa git show nem busca código de referência pela rede.

## Integração com a página de lobby

A barra é inserida em `#gc-ext-wrapper`, espaço utilizado pelos controles de extensão, sem substituir os botões existentes ou inserir o painel junto à lista nativa. Se o contêiner ainda não existir, o controlador aguarda sua criação; as estatísticas e os filtros salvos continuam sendo processados. A recriação do contêiner preserva as preferências.

A inicialização pertence a `src/content-scripts/lobby/index.js`; o controlador não integra mais o bundle geral. A injeção segue as rotas já declaradas para o módulo de lobby no manifest. A navegação SPA após o carregamento desse módulo continua coberta pelos testes.

No cenário sintético que começa fora dessas rotas, mudar somente a URL com `history.pushState` não injeta o módulo; é necessário recarregar o documento no lobby. Essa limitação é verificada explicitamente no teste de navegador. O responsável não encontrou essa transição sem recarga nos caminhos reais que experimentou na GamersClub; isso não comprova a inexistência de navegação SPA em todos os fluxos da plataforma.

O posicionamento da barra no contêiner de extensões foi conferido pelo responsável no Opera GX. Essa conferência é adicional às validações das compilações clean.3 e clean.4 descritas acima.
