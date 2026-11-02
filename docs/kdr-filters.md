# Filtros de KDR nos lobbies

A barra permite habilitar separadamente o mínimo de KDR médio e o mínimo de todos os jogadores. Ambos começam desligados, com mínimos de 1.00. Os controles aceitam ponto ou vírgula e incrementos de 0.05. A comparação é inclusiva, em duas casas: com mínimo 1.00, 0.99 reprova; 1.00 e 1.01 atendem ao requisito.

As preferências usam `chrome.storage.sync`; os toggles também são sincronizados com as opções da extensão. A aplicação acompanha alterações do DOM e navegação SPA, sem botão de atualização, polling, novas requisições ou scroll automático. A média e os badges continuam sendo apresentados quando os filtros estão desligados.

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

A suíte tem 59 testes de regras/DOM e um cenário de navegador que verifica controles, SPA, persistência, progressão com IntersectionObserver, ausência da dica removida e estabilidade geométrica do contador. Inclui comparação do renderizador de médias com a base oficial e fixture explicitamente sintético com um card e um skeleton. Não inclui vídeos, capturas ou dados reais de jogadores.

## Homologação real e limites

Seis cenários foram relatados como aprovados no Opera GX, na compilação local clean.3:

1. Flicker eliminado.
2. Contador estável.
3. Filtros médio e individual funcionando.
4. Média e badges originais preservados.
5. Carregamento progressivo funcionando.
6. Nenhuma alternância excessiva de cards com a página parada.

A clean.4 removeu somente a explicação visível e o espaço vazio do rodapé. Passou nos testes automatizados, mas ainda aguarda conferência visual final no navegador. A homologação completa de desafios, máximo legado, perfis e todos os fluxos de partida não está concluída. Períodos estatísticos e técnicas internas de virtualização da plataforma não foram comprovados.

A versão oficial do manifest/package é preservada. A identificação clean.4 pertence aos builds locais; não é uma nova versão oficial proposta no código do PR.
