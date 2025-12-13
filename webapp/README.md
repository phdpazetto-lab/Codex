# Guia do layout HTML

Este guia documenta a estrutura do `index.html`, aponta onde cada parte da página vive e explica como integrar os arquivos `styles.css` e `app.js` com o conteúdo existente.

## Visão geral da página
- **Navegação superior (`header.top-nav`)**: mostra a marca "StarPay" e botões para alternar entre as seções `Dashboard`, `Contas Fixas`, `Contas Pontuais` e `Contas do Mês`.
- **Área principal (`main.main-container`)**: agrupa cada página como uma `<section>` com `id` correspondente (`dashboard`, `contas-fixas`, `contas-pontuais`, `contas-mes`). A seção ativa recebe a classe `active`.
- **Legenda de status no Dashboard**: três ícones SVG indicam estados de pagamento: `Pago`, `Atrasado` e `Vencendo`.
- **Área de conteúdo**: cada seção tem um placeholder (`.dashboard-placeholder` ou `.content-placeholder`) para receber o conteúdo real.
- **Toast/Notificações (`#toast-container`)**: elemento dedicado para mensagens de feedback com `aria-live="polite"`.
- **Assets externos**: o `<link rel="stylesheet" href="styles.css" />` carrega os estilos globais e `<script type="module" src="app.js"></script>` carrega a lógica em módulo.

## Como integrar `styles.css`
1. Mantenha o arquivo `styles.css` no mesmo diretório de `index.html` ou ajuste o `href` do `<link>` para o caminho correto (ex.: `./css/styles.css`).
2. Este repositório já inclui as classes usadas no `index.html`, cobrindo navegação (`.top-nav`, `.nav-links`, `.nav-link` + estado `.active`), estrutura de página (`.main-container`, `.page-section`, `.section-header`), placeholders (`.dashboard-placeholder`, `.content-placeholder`), legenda de status (`.status-legends`, `.status-item`, `.status-icon` com estados `.paid`, `.overdue`, `.due-soon`) e toasts (`#toast-container`, `.toast`).
3. Para personalizar cores, ajuste as variáveis do `:root` ou crie novas classes de estado (ex.: `.status-icon.scheduled { color: #...; }`).
4. Em telas menores, a navegação já se adapta via `@media (max-width: 720px)`; ajuste esse breakpoint se necessário.

## Como integrar `app.js`
1. O `<script type="module" src="app.js"></script>` já aponta para a implementação base incluída neste repositório. Mantenha `app.js` no mesmo diretório ou ajuste o `src` conforme a sua estrutura.
2. O script atual:
   - Alterna seções ao clicar em `.nav-link`, aplicando a classe `.active` no botão e na `<section>` correspondente.
   - Gera um toast simples a cada troca de seção, usando o `#toast-container` e as classes `.toast` (variantes `info`, `success`, `error`).
   - Garante que ao menos uma seção apareça se nenhuma estiver marcada com `.active` no carregamento.
3. Para expandir a lógica, adicione funções de carregamento dinâmico para cada seção ou crie novos utilitários de toast (por exemplo, `createToast('Salvo com sucesso', 'success')`).
4. Caso use bundlers ou importações adicionais, mantenha `type="module"` e utilize imports relativos (ex.: `import { carregarDashboard } from './dashboard.js';`).

## Personalização passo a passo
- **Adicionar uma nova seção**
  1. Crie um novo botão na navegação com `data-section="novo-id"`.
  2. Adicione uma `<section id="novo-id" class="page-section">` dentro do `<main>`, com o conteúdo inicial ou placeholder.
  3. No `app.js`, amplie a lógica de navegação para incluir o novo `id`.

- **Trocar ou estender a legenda de status**
  1. Copie um bloco `.status-item` dentro da legenda do Dashboard.
  2. Atualize o texto e o SVG conforme o novo estado (ex.: "Agendado").
  3. Defina a classe de estado no CSS (ex.: `.status-icon.scheduled { color: #...; }`).

- **Conectar dados reais**
  1. Substitua os parágrafos das áreas de placeholder pelo markup real (tabelas, cards, formulários).
  2. Use `data-*` attributes ou `id` em elementos que precisar manipular no `app.js` (ex.: `id="lista-contas-fixas"`).
  3. Dispare toasts chamando uma função utilitária no `app.js` que injete mensagens em `#toast-container`.

## Estrutura mínima do diretório
```
webapp/
├─ index.html   # Layout SPA e pontos de integração
├─ styles.css   # Estilos globais e temas de status
└─ app.js       # Lógica de navegação, dados e toasts
```

## Checklist rápido
- [ ] O caminho de `styles.css` está correto e as classes esperadas estão definidas.
- [ ] `app.js` está no lugar, importando outros módulos se necessário com `type="module"`.
- [ ] Cada botão da navegação aponta para uma seção com `id` correspondente.
- [ ] O `#toast-container` está sendo utilizado para feedbacks.
- [ ] Placeholders foram substituídos pelo conteúdo final das páginas.
