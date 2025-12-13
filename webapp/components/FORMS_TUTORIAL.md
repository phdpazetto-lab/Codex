# Guia rápido: formulários de contas (Apps Script)

Este tutorial explica como usar os formulários de contas **fixas** e **pontuais** no ambiente do Google Apps Script, onde o código client-side fica dentro de arquivos `.html` (sem `.js` separado).

## O que os formulários fazem
- Renderizam inputs com rótulos, requisitos de preenchimento e validações (campos obrigatórios, número mínimo zero, intervalo de dia 1-31 e data válida).
- Enviam os dados para as funções de servidor `cadastrarContaFixa` e `cadastrarContaPontual` via `google.script.run` (ou um objeto `server` em modo mock/local).
- Exibem toasts de sucesso/erro, limpam o formulário e chamam `carregarContasFixas`, `carregarContasPontuais` e `carregarContasMes` quando essas funções existem na página.

## Arquivo incluído
- `components/forms.html`: contém **o script completo** dos formulários e o bootstrap automático via `DOMContentLoaded`.

## Como incluir no seu `index.html`
1. Adicione contêineres para os formulários onde eles devem aparecer:
   ```html
   <div id="conta-fixa-container" class="content-block"></div>
   <div id="conta-pontual-container" class="content-block"></div>
   ```
2. Inclua o arquivo de formulários antes de fechar o `<body>`:
   ```html
   <?!= include('components/forms'); ?>
   ```
3. Garanta que os IDs acima estejam presentes. O script se auto-inicializa com `DOMContentLoaded` e monta ambos os formulários automaticamente.

## Como funciona a validação
- **Obrigatórios**: nome, categoria, tipo de pessoa; e data de vencimento para conta pontual.
- **Número**: `valorPrevisto` precisa ser numérico ≥ 0.
- **Dia de recorrência**: aceita apenas inteiros de 1 a 31.
- **Data**: valida se a data existe e extrai o dia para o range check.

## Hooks de atualização
Após o sucesso do envio, o script:
- Reseta o formulário;
- Chama `carregarContasFixas()`, `carregarContasPontuais()` e `carregarContasMes()` se estiverem definidos para atualizar listas e visões consolidadas.

## Toasts
Mensagens de feedback são exibidas via elementos dinâmicos inseridos no `body` com as classes `toast`, `toast-success` e `toast-error`. Estilize-as no seu CSS global.
