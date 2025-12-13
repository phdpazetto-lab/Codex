# StarPay WebApp – Guia Rápido do `app.js`

Este documento resume como o `app.js` foi estruturado, quais dependências de DOM/Apps Script são esperadas e como preparar o ambiente para que a UI funcione sem erros.

## Visão geral

O `app.js` concentra três responsabilidades:

1. **Estado global** – filtros e datasets compartilhados entre seções.
2. **Roteamento de seções** – alternância via hash (`#secao`) ou botões/links com `data-section-target` / `.nav-link`.
3. **Cliente GAS** – camada de comunicação com `google.script.run` com loading e tratamento de erros centralizados.

Ele é carregado após o `DOMContentLoaded` e dispara um primeiro carregamento de contas do mês (`carregarContasMes`).

## Estrutura de DOM necessária

Para funcionar corretamente, a página deve conter os seguintes elementos (IDs/atributos podem ser adicionados ao HTML existente):

- **Seções de página**: elementos com `data-section="<nome>"` ou `id="<nome>"` (ex.: `contas-mes`). Um deles pode já ter `active` ou `is-active`; se nenhum tiver, a primeira seção é ativada automaticamente.
- **Botões de navegação**: qualquer elemento com `data-section-target="<nome>"` ou `.nav-link` com `data-section="<nome>"`. Eles alternam as seções e mantêm o hash sincronizado.
- **Contêiner de contas do mês**: um elemento com `data-contas-mes` para receber a lista renderizada.
- **Indicador de carregamento**: opcional, elemento com `data-loader` (ex.: overlay com spinner) exibido durante chamadas ao servidor.
- **Área de alerta**: opcional, elemento com `data-alert` onde mensagens de erro são exibidas. Sem ele, os erros caem em `alert()`.
- **Contêiner de toast**: opcional, `#toast-container` para notificações curtas usadas na navegação.

## Serviços Apps Script esperados

O cliente GAS assume que as seguintes funções existem e estão publicadas no Apps Script do WebApp:

- `listarContasFixas(payload)`
- `criarContaFixa(payload)`
- `criarContaPontual(payload)`
- `listarContasMes(payload)`
- `marcarPago(payload)`
- `gerarMes(payload)`
- `processarLembretes(payload)`

> Dica: todos recebem um `payload` (objeto) e retornam dados compatíveis com as renderizações da UI. Para `listarContasMes`, espere um array de contas com propriedades `nomeConta`/`nome`, `vencimento`, `valorPrevisto`/`valor` e `pago`.

## Fluxo de inicialização

1. `DOMContentLoaded` dispara `initApp()`.
2. `setupRouting()` configura listeners de hash/botões/links e ativa a seção correta.
3. `carregarContasMes()` chama `gasClient.listarContasMes` com os filtros padrão (`todas`) e renderiza a lista.

## Comportamento do cliente GAS

- Toda chamada passa por `callServer(fn, payload, onSuccess, onError)`, que:
  - Valida a presença de `google.script.run` e da função chamada.
  - Exibe o loader (`data-loader`) e limpa alertas anteriores.
  - Encaminha sucessos para o callback informado e falhas para `onError` ou `showError`.
- Você pode consumir diretamente pelo objeto global `gasClient` (ex.: `gasClient.criarContaFixa(dados, cbSucesso, cbErro)`), ou reaproveitar `callServer` para novas funções do servidor.

## Presets/recomendações

- **Publicação do WebApp**: a página precisa estar servida pelo Apps Script para que `google.script.run` exista. Em ambiente local (sem Apps Script), as chamadas exibirão um erro controlado.
- **Hash navigation**: URLs podem incluir `#contas-mes` (ou outro `data-section`) para abrir a seção correspondente diretamente.
- **Acessibilidade**: `.nav-link` recebe `aria-current="page"` quando ativa.
- **Extensibilidade**: novos datasets ou filtros podem ser adicionados ao objeto `state`. Novas rotas só exigem incluir o mesmo nome em `data-section`, `id` e nos triggers.

## Depuração rápida

- Não vê nada renderizado? Verifique se existe um elemento com `data-contas-mes` e se o servidor retorna um array.
- Loader não aparece? Confirme se o elemento com `data-loader` não está escondido por CSS e se há chamadas a `gasClient` sendo feitas.
- Erros silenciosos? Adicione um elemento `data-alert` para mensagens visíveis e acompanhe o console do navegador.

