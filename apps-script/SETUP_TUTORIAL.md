# Planilha de Setup (Apps Script)

Este guia explica o que o script `setup.gs` cria e como usá-lo para evitar planilhas duplicadas.

## O que o script monta
- Abas obrigatórias com cabeçalhos protegidos: `CONFIG`, `CONTAS_FIXAS`, `CONTAS_MENSAL`.
- Aba opcional `LOGS` (criada se já existir ou mantida se presente).
- Linhas de cabeçalho são fixadas e protegidas contra edição.
- Dados de demonstração opcionais para validar a interface (contas fixas + lançamentos mensais).
- Persistência de um ID de planilha padrão em Propriedades do Script, para que execuções futuras reutilizem a mesma planilha.

## Funções principais
- `createOrResetSpreadsheet(spreadsheetId?, spreadsheetName?)`
  - Cria ou reutiliza a planilha informada.
  - Garante as abas com cabeçalhos corretos e limpa abas inesperadas.
  - Retorna a URL da planilha para você copiar no log.
- `seedConfig(spreadsheetId?)`
  - Preenche valores padrão em `CONFIG` (e-mails, dias, avisos, horário e fuso).
- `seedDemoData(spreadsheetId?)`
  - Insere 2–3 contas fixas de exemplo e 2 lançamentos mensais de teste.
- `setupDemoSpreadsheet(spreadsheetId?, spreadsheetName?)`
  - Execução completa: cria/redefine a planilha e chama `seedConfig` + `seedDemoData`.
- `setDefaultSpreadsheetId(spreadsheetId)`
  - Salva o ID para que as próximas execuções usem sempre a mesma planilha.
- `clearDefaultSpreadsheetId()`
  - Remove o ID salvo, permitindo escolher outra planilha na próxima execução.

## Como executar no Apps Script
1) Abra o editor do Apps Script do seu projeto e selecione o arquivo `setup.gs`.
2) No menu de funções (topo da IDE), escolha **`setupDemoSpreadsheet`** e clique em **Run**.
3) Aprove as permissões solicitadas.
4) Confira o log/retorno: ele traz a **URL da planilha**. Abra para ver as abas e os dados exemplo.

## Reutilizar uma planilha existente (não criar novas)
- Se já tem uma planilha-alvo, chame **`setDefaultSpreadsheetId('SEU_ID')`** uma vez. Depois rode `setupDemoSpreadsheet` sem parâmetros – o script vai reutilizar a mesma planilha.
- Para mudar de planilha, execute **`clearDefaultSpreadsheetId()`** e depois chame `setDefaultSpreadsheetId` com o novo ID.

## Personalizações rápidas
- Quer apenas os cabeçalhos sem dados demo? Execute **`createOrResetSpreadsheet()`** sozinho.
- Precisa atualizar configurações sem recriar abas? Rode **`seedConfig()`**.
- Precisa repovoar apenas os exemplos? Rode **`seedDemoData()`**.

## Dicas
- O ID da planilha é a string entre `/d/` e `/edit` na URL da planilha.
- Se a planilha ativa já estiver aberta no Apps Script, o script a reutiliza automaticamente.
- Se faltar alguma aba, basta reexecutar `createOrResetSpreadsheet` ou `setupDemoSpreadsheet`.

## Próximos passos
- Revise os valores na aba **CONFIG** (e-mails de notificação, fuso horário e janelas de aviso) para combinar com seu fluxo real.
- Substitua os exemplos de **CONTAS_FIXAS** e **CONTAS_MENSAL** pelos seus lançamentos reais e remova os dados demo que não precisar.
- Ative os gatilhos do seu projeto principal (por exemplo, agenda semanal ou diária) apontando para as funções que consomem essas abas.
- Se for colaborar com outra pessoa, compartilhe a planilha com permissão de edição e mantenha os cabeçalhos protegidos.
