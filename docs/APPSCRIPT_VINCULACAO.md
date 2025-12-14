# Como vincular o Apps Script à planilha do Google Sheets

Use estas etapas para colar os arquivos da pasta `apps-script/` diretamente no projeto vinculado à sua planilha (via **Extensões → Apps Script**), garantindo que as funções chamadas pelo front-end (listar/cadastrar/gerar) funcionem na sua cópia do Sheets.

## 1) Abrir o projeto correto
1. Abra a sua planilha no Google Sheets.
2. Clique em **Extensões → Apps Script**. Isso cria/abre um **projeto vinculado** à planilha atual. Você deve ver o nome da planilha no canto superior esquerdo do editor.

## 2) Criar os arquivos do backend
No editor do Apps Script, crie arquivos com os mesmos nomes da pasta `apps-script/` e cole os conteúdos correspondentes:
- `constants.gs` e `utils.gs` (helpers e acesso a abas).
- `contasFixas.gs` (CRUD das contas fixas).
- `motorMensal.gs` + `contasMensal.gs` (geração do mês, contas pontuais e marcação de pagamento).
- `notificacoes.gs` e `logs.gs` (envio de e-mail e auditoria).
- `triggers.gs` (configurar os gatilhos `gerarMesAutomatico` e `enviarNotificacoesDiarias`).

Dica: copie/cole o conteúdo de cada arquivo deste repositório para um arquivo do mesmo nome no Apps Script. Não é necessário build ou transpile.

## 3) Preparar as abas do Sheets
Verifique (ou crie) as seguintes abas com cabeçalhos:
- **CONFIG**: colunas `PARAM` (A) e `VALUE` (B). Inclua ao menos `HORA_ENVIO_DIARIO` (HH:MM) e `EMAILS_NOTIFICACAO`.
- **CONTAS_FIXAS**: cabeçalhos conforme `CONTAS_FIXAS_HEADERS` em `constants.gs` (ID_CONTA, NOME_CONTA, ... , ATIVA).
- **CONTAS_MENSAL**: cabeçalhos conforme `CONTAS_MENSAL_HEADERS` (ID_MENSAL, ID_CONTA_ORIGEM, ..., OBSERVACOES).
- **LOGS**: se não existir, os scripts criarão ao registrar eventos.

## 4) Autorizar e testar funções principais
1. No Apps Script, selecione a função `gerarMes` e clique em **Executar**. Autorize o acesso às planilhas quando solicitado.
2. Execute `listarContasFixas` e `listarContasMes` para validar a leitura das abas.
3. Se for usar automações, execute `configurarTriggers` para criar os gatilhos mensais e diários.

## 5) Publicar a WebApp (opcional)
Se quiser expor o front-end:
1. Em **Implantar → Nova implantação**, escolha **Aplicativo da Web**.
2. Defina **Executar como**: você mesmo (ou uma conta de serviço) e **Quem tem acesso**: "Qualquer pessoa" ou conforme a política desejada.
3. Clique em **Implantar** e copie a URL gerada. Esse endereço pode ser usado no menu da planilha ou compartilhado.

Seguindo estas etapas, o projeto fica 100% vinculado à sua planilha, permitindo que os formulários do `webapp/` chamem `criarContaFixa`, `criarContaPontual`, `listarContasMes` e `marcarPago` diretamente via `google.script.run`.
