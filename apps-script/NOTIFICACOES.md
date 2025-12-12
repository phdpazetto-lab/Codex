# Notificações e lembretes (Apps Script)

Este documento resume como o `notificacoes.gs` funciona, os pré-requisitos para execução correta e como testar/visualizar os e-mails gerados.

## Visão geral
- **carregarConfig** lê a aba `CONFIG` (coluna A `Parâmetro`, coluna B `Valor`) e entrega um objeto de configuração.
- **processarLembretes** percorre a aba `CONTAS_MENSAL`, identifica contas a notificar (dias antes, no dia ou após vencimento), envia e-mails para os endereços configurados e marca `NOTIFICACAO_ENVIADA` para evitar envios duplicados.
- **templateEmail(conta, tipoAviso)** monta o corpo HTML com status, vencimento, valor e instruções/link de pagamento.
- **previewNotificacao(id, tipoAviso)** gera o HTML de um aviso para inspeção no log sem enviar e-mail.

## Pré-requisitos essenciais para uma execução perfeita
1. **Planilhas existentes**
   - `CONFIG` com as colunas `Parâmetro` (A) e `Valor` (B) preenchidas.
   - `CONTAS_MENSAL` com as colunas esperadas, incluindo `NOTIFICACAO_ENVIADA` na coluna N (índice 14 1-based).
2. **Parâmetros mínimos em `CONFIG`**
   - `EMAILS_NOTIFICACAO`: lista de destinatários separada por `;`.
   - `DIAS_ANTES_VENCIMENTO`: número inteiro de dias antes do vencimento para disparar alerta.
   - `ENVIAR_NO_DIA_DO_VENCIMENTO`: `SIM`/`NAO` para avisos no dia.
   - `ENVIAR_AVISO_APOS_VENCIMENTO`: `SIM`/`NAO` para avisos após o vencimento.
   - (Opcional) `FUSO_HORARIO`: ex. `America/Sao_Paulo`; se ausente, usa o fuso padrão do script.
3. **Permissões**
   - O Apps Script precisa de autorização para **ler/editar** a planilha e **enviar e-mails** (serviço `MailApp`).
4. **Integridade dos dados em `CONTAS_MENSAL`**
   - Coluna A: `ID_MENSAL` (identificador usado pelo preview).
   - Coluna C: `NOME_CONTA`.
   - Coluna G: `VALOR_PREVISTO` (ou `VALOR_REAL` na coluna H, se disponível).
   - Coluna H: `VALOR_REAL` (opcional; usado se preenchido).
   - Coluna I: `VENCIMENTO` (data).
   - Coluna J: `DATA_PAGAMENTO` (data) — usada apenas para contexto.
   - Coluna K: `PAGO` (`SIM` quando quitado; ignora notificações se marcado).
   - Coluna N: `NOTIFICACAO_ENVIADA` (`SIM` após envio para evitar duplicidade).
   - Coluna O: `OBSERVACOES` (link ou instruções de pagamento exibidas no e-mail).

## Fluxo de funcionamento
1. `processarLembretes` coleta configurações e destinatários.
2. Para cada linha válida em `CONTAS_MENSAL`:
   - Ignora linhas sem vencimento, marcadas como pagas (`PAGO = SIM`) ou já notificadas (`NOTIFICACAO_ENVIADA = SIM`).
   - Calcula a diferença de dias entre hoje e o vencimento, aplicando as regras:
     - **ANTES** quando `diffDias === DIAS_ANTES_VENCIMENTO`.
     - **HOJE** quando `diffDias === 0` e `ENVIAR_NO_DIA_DO_VENCIMENTO = SIM`.
     - **ATRASADO** quando `diffDias < 0` e `ENVIAR_AVISO_APOS_VENCIMENTO = SIM`.
   - Monta assunto e corpo com `templateEmail` e envia para todos os destinatários.
   - Marca `NOTIFICACAO_ENVIADA` com `SIM` na linha correspondente.

## Como testar
- **Pré-visualização sem envio:**
  - Execute `previewNotificacao(<ID_MENSAL>, <TIPO_AVISO>)` no editor do Apps Script. O HTML aparece no `Logger`.
- **Processamento completo:**
  - Execute `processarLembretes()` manualmente ou agende um gatilho (cron) no Apps Script.
  - Verifique se as linhas elegíveis são marcadas como `NOTIFICACAO_ENVIADA` após a execução.

## Dicas para evitar problemas
- Sempre preencha `EMAILS_NOTIFICACAO`; o script aborta sem destinatários.
- Mantenha datas em formato de data real (não texto) para cálculos corretos.
- Não reutilize `NOTIFICACAO_ENVIADA = SIM` em linhas antigas se quiser reavisar: limpe a célula antes de reprocessar.
- Ajuste `DIAS_ANTES_VENCIMENTO` e flags de envio para refletir a política desejada antes de agendar o gatilho.

