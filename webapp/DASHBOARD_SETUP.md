# Dashboard e Pré-requisitos

Este projeto usa o `dashboard.html` dentro de `webapp/components` para exibir KPIs e gráficos em Google Apps Script. O `index.html` inclui o snippet via `<?!= include('components/dashboard'); ?>` e chama `loadDashboard()` quando o DOM é carregado.

## Como funciona
- **Agregação:** `dashboard.html` agrega os registros retornados por `listarContasMes()` para calcular totais (previsto, pago, em aberto) e contagens (atrasadas, vencendo).
- **Gráficos leves:** Usa `<canvas>` nativo (sem bibliotecas externas) para pizza (categorias), barras (PF vs PJ, métodos) e linha (evolução mensal).
- **Renderização:** Exponibiliza `renderDashboard(records)` para uso manual e `loadDashboard()` que chama `google.script.run.listarContasMes()` (Apps Script) e então exibe os dados.

## Pré-requisitos para rodar
1. **Templates incluídos:** `index.html` deve estar em um projeto Apps Script com os modelos/arquivos:
   - `Styles` (CSS da aplicação).
   - `components/dashboard` (conteúdo de `webapp/components/dashboard.html`).
   - `contasMes`, `App`, `forms` (outros includes usados no layout).
2. **Função do lado servidor:** Implemente `listarContasMes()` em `Code.gs` (ou arquivo Apps Script) retornando um array de objetos com os campos usados:
   - Valores: `VALOR_PREVISTO` (ou `valorPrevisto/valor_previsto`) e `VALOR_REAL` (ou `valorReal/valor_real`).
   - Datas: `VENCIMENTO` (ou `vencimento`) em `dd/MM/yyyy`, `yyyy-MM-dd` ou objeto `Date`.
   - Status: `PAGO`/`pago` ("SIM"/"TRUE" para pagos); `ATRASADO` opcional para marcar atrasados.
   - Classificações: `TIPO_PESSOA` (`PF`/`PJ`), `CATEGORIA`, `METODO_PAGAMENTO` (ou variantes em camel_case/snake_case).
3. **Permissões:** o script deve ter acesso às fontes de dados (Sheets/DB) para preencher `listarContasMes()`.
4. **Navegação:** mantenha a classe `active` em `<section id="dashboard">` quando quiser o painel visível; `App`/JS de navegação deve alternar as seções conforme seus botões de menu.

## Uso rápido
- Publique o projeto como Web App ou use o Editor Apps Script para pré-visualizar.
- Garanta que `listarContasMes()` retorne dados; o painel inicializa automaticamente via `loadDashboard()` assim que o DOM carrega.
- Para testes locais, chame `renderDashboard(mockRecords)` no console do navegador (Editor Apps Script) passando um array com o formato acima.
