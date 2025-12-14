# Plano de Execução para Finalização

## Status atual
- **Backend (Apps Script)**: O motor mensal já cria a aba `CONTAS_MENSAL` para o mês de referência, reaproveitando contas variáveis existentes, clonando contas fixas ativas e recalculando atrasos, além de permitir inclusão pontual de contas mensais. 【F:apps-script/motorMensal.gs†L1-L178】
- **Triggers/automação**: Existe um helper documentado para recriar automaticamente os triggers de geração mensal e notificações diárias com base no horário configurado na aba `CONFIG`. 【F:apps-script/README.md†L1-L54】
- **Frontend atual**: `index.html` foi consolidado (sem HTML duplicado), os formulários de contas fixas e pontuais foram centralizados em `app.js` e estão conectados às funções `criarContaFixa` e `criarContaPontual`, e a tabela de Contas do Mês agora usa `listarContasMes`, `marcarPago` e o gatilho de `gerarMes` diretamente. 【F:webapp/index.html†L1-L88】【F:webapp/app.js†L1-L216】
- **Referência de produto**: O README geral descreve o escopo completo: cadastros de contas fixas e pontuais, geração automática mensal, lembretes por e-mail, UI corporativa e dashboard financeiro. 【F:README.md†L26-L150】

## Pendências imediatas
- Integrar e validar o fluxo de notificações (configuração de horários, e-mails e modos antes/no/apos vencimento) aproveitando o helper de triggers. 【F:apps-script/README.md†L1-L54】【F:README.md†L30-L35】
- Iniciar o dashboard financeiro (KPIs, gráficos, status legendados) ainda ausente na UI. 【F:README.md†L133-L150】

## Próximos passos recomendados
1. **Refatorar `app.js`** para remover o stub final, exportar apenas uma inicialização e preparar módulos por página (contas fixas, pontuais, contas do mês, dashboard) reutilizando o estado compartilhado. 【F:webapp/app.js†L4-L238】【F:webapp/app.js†L242-L277】
2. **Criar formulários completos** nas seções de cadastro, chamando `criarContaFixa` e `criarContaPontual` via `gasClient`, com validação de campos conforme o spec (categoria, tipo PF/PJ, valores, dia de recorrência). 【F:README.md†L30-L119】
3. **Evoluir “Contas do Mês”** para tabela responsiva com filtros persistentes e ações de marcar pagamento (chamando `marcarPago`), atualização de mês e gatilho para `gerarMes`. 【F:webapp/app.js†L185-L225】【F:apps-script/motorMensal.gs†L82-L178】
4. **Configurar e testar automações** executando `configurarTriggers` no Apps Script, validando horário de envio e handlers `gerarMesAutomatico`/`enviarNotificacoesDiarias`, e instrumentando logs de execução. 【F:apps-script/README.md†L1-L54】
5. **Implementar lembretes de e-mail** (antes, no dia e após vencimento) com base nos parâmetros da aba CONFIG e registrar envios na aba de logs. 【F:README.md†L69-L119】
6. **Construir o dashboard** com KPIs, gráficos e legenda de status conforme o layout corporativo descrito no README, consumindo dados agregados da planilha. 【F:README.md†L133-L150】
