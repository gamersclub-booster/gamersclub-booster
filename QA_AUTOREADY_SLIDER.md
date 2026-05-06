# QA AutoReady Slider

Checklist de regressao local para o `Aceitar Ready` com slider `0-10s`.

## Contrato do recurso

- `Aceitar Ready` desligado:
  - nao executa AutoReady
  - slider fica visivel, mas desabilitado
- `Aceitar Ready` ligado com `0s`:
  - aceita com `1ms`
  - nao mostra popup
- `Aceitar Ready` ligado com `1..10s`:
  - mostra popup
  - inicia countdown
  - `Decidir manualmente` bloqueia o aceite da ocorrencia atual
  - `Aceitar automatico` aceita imediatamente
  - sem acao, aceita ao final do countdown

## Cenarios obrigatorios

1. `0s`
- ligar `Aceitar Ready`
- colocar slider em `0`
- confirmar que aceita sem popup

2. `5s`
- ligar `Aceitar Ready`
- colocar slider em `5`
- confirmar que popup aparece
- confirmar que aceita ao final do countdown

3. `10s`
- ligar `Aceitar Ready`
- colocar slider em `10`
- confirmar que popup aparece com `10s`

4. Decisao manual
- abrir popup
- clicar em `Decidir manualmente`
- confirmar que nao houve aceite

5. Rerender curto do Ready
- simular ou observar re-render curto do botao durante countdown
- confirmar que popup nao reabre
- confirmar que countdown nao reinicia

6. Mudanca entre ocorrencias
- `5s -> 0s`
- `5s -> 10s`
- `10s -> 0s`
- confirmar que a proxima ocorrencia usa o novo valor

7. Mudanca durante ocorrencia atual
- `5s -> 0s`
- `5s -> 10s`
- `10s -> 0s`
- confirmar que a ocorrencia atual continua com o delay original
- confirmar que a nova configuracao vale para o proximo Ready

## Comandos de validacao

```powershell
npm.cmd run lint
npm.cmd run build
```

## Riscos conhecidos

- a deteccao do botao ainda depende do texto `Ready`
- a nova microcopy ainda nao esta integrada ao sistema de traducoes
- comportamento final precisa de validacao na GC real, alem da simulacao controlada
