# Contas do Mês – guia rápido

Este componente HTML oferece uma tabela responsiva para listar as contas do mês com realce visual de status, ações rápidas e carregamento via Google Apps Script ou endpoint HTTP.

## Inclusão no Apps Script HTML Service
1. Adicione o conteúdo de `contasMes.html` como include no `Index.html` (por exemplo, `<?!= HtmlService.createHtmlOutputFromFile('components/contasMes').getContent(); ?>`).
2. Certifique-se de ter um elemento `div` com `id="contasMesWrapper"` na página. O próprio arquivo já traz um wrapper; se você já tiver um container, mantenha apenas um deles para evitar duplicação.
3. Garanta que funções globais opcionais usadas pelos botões existam, se desejadas:
   - `marcarPago(conta)` para registrar pagamento (modal, inline etc.).
   - `editarConta(conta)` para edição.

## Uso no front-end
- Chame `carregarContasMes(filtros)` ao carregar a página ou ao trocar filtros. O botão “Refresh” chama o mesmo loader.
- Para desenhar dados já carregados localmente, use `renderTabelaContasMes(lista, filtros)` passando um array de objetos.
- A tabela mostra colunas para nome, categoria, PF/PJ, valores previsto/real, vencimento, pagamento, status (badges Pago/Atrasado/Em aberto), método, origem, observações e ações.

## Fonte de dados
- **Apps Script**: exponha `obterContasMes(filtros)` no lado do servidor. O script chama `google.script.run` e recebe o array de contas.
- **HTTP fallback**: configure `POST /api/contas-mes` que retorne JSON com o array quando `google.script.run` não estiver disponível.

## Estrutura esperada dos itens
Cada objeto pode usar chaves maiúsculas ou minúsculas:
- `nome`/`NOME_CONTA`, `categoria`/`CATEGORIA`, `tipo`/`TIPO_PESSOA`, `valorPrevisto`/`VALOR_PREVISTO`, `valorReal`/`VALOR_REAL`, `vencimento`/`VENCIMENTO`, `pagamento`/`DATA_PAGAMENTO`, `metodo`/`METODO_PAGAMENTO`, `origem`/`ORIGEM`, `observacoes`/`OBSERVACOES`, `pago`/`PAGO`, `atrasado`/`ATRASADO`.

## UX e estados visuais
- **Badges**: verde para pago, vermelho para atrasado, azul para em aberto.
- **Linhas**: verde claro para pago, amarelo para vencendo em até 3 dias, vermelho suave para atrasadas.
- **Acessibilidade**: wrapper recebe `aria-busy` durante carregamentos; tabela é responsiva com scroll horizontal em telas pequenas.

## Pré-requisitos
- Ambiente Apps Script ou página servida com permissão para executar o JS inline.
- Se usar o fallback HTTP, servidor deve responder a `POST /api/contas-mes` com JSON.
- Funções `marcarPago`/`editarConta` são opcionais; sem elas, o componente mostra um alerta ao clicar.

