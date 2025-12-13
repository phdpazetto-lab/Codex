// Funções de lembretes e notificações por e-mail.

/**
 * Carrega os parâmetros da aba CONFIG como um objeto chave-valor.
 * Espera que a aba contenha colunas "Parâmetro" (col A) e "Valor" (col B).
 */
function carregarConfig() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = planilha.getSheetByName('CONFIG');
  if (!sheet) {
    throw new Error('Aba CONFIG não encontrada.');
  }
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return {};
  }
  const valores = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  return valores.reduce((acc, [chave, valor]) => {
    if (chave) {
      acc[String(chave).trim().toUpperCase()] = valor;
    }
    return acc;
  }, {});
}

/**
 * Processa a aba CONTAS_MENSAL e envia e-mails conforme regras de aviso.
 * Respeita as configurações de dias antes, no dia e após o vencimento.
 * Marca NOTIFICACAO_ENVIADA para evitar envios duplicados.
 */
function processarLembretes() {
  const config = carregarConfig();
  const tz = config.FUSO_HORARIO || Session.getScriptTimeZone();
  const emails = (config.EMAILS_NOTIFICACAO || '')
    .toString()
    .split(';')
    .map(e => e.trim())
    .filter(Boolean);
  if (!emails.length) {
    Logger.log('Nenhum e-mail configurado em EMAILS_NOTIFICACAO.');
    return;
  }

  const diasAntes = parseInt(config.DIAS_ANTES_VENCIMENTO, 10) || 0;
  const enviarNoDia = String(config.ENVIAR_NO_DIA_DO_VENCIMENTO || '').toUpperCase() === 'SIM';
  const enviarApos = String(config.ENVIAR_AVISO_APOS_VENCIMENTO || '').toUpperCase() === 'SIM';

  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = planilha.getSheetByName('CONTAS_MENSAL');
  if (!sheet) {
    throw new Error('Aba CONTAS_MENSAL não encontrada.');
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    Logger.log('Nenhuma conta para processar.');
    return;
  }

  const lastColumn = sheet.getLastColumn();
  const dados = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();

  const hoje = new Date();
  const hojeStr = Utilities.formatDate(hoje, tz, 'yyyy-MM-dd');
  const dataHoje = new Date(hojeStr);
  const msDia = 1000 * 60 * 60 * 24;

  const notificacaoColIndex = 14; // Coluna NOTIFICACAO_ENVIADA (1-based)
  const atualizacoes = [];

  dados.forEach((linha, idx) => {
    const idMensal = linha[0];
    const nomeConta = linha[2];
    const valorPrevisto = linha[5];
    const valorReal = linha[6];
    const vencimento = linha[7];
    const dataPagamento = linha[8];
    const pago = (linha[9] || '').toString().toUpperCase();
    const notificacaoEnviada = (linha[13] || '').toString().toUpperCase();

    if (!vencimento || pago === 'SIM' || notificacaoEnviada === 'SIM') {
      return;
    }

    const vencimentoDate = new Date(vencimento);
    const vencimentoStr = Utilities.formatDate(vencimentoDate, tz, 'yyyy-MM-dd');
    const dataVencimento = new Date(vencimentoStr);
    const diffDias = Math.floor((dataVencimento - dataHoje) / msDia);

    let tipoAviso = null;
    if (diffDias === diasAntes) {
      tipoAviso = 'ANTES';
    } else if (diffDias === 0 && enviarNoDia) {
      tipoAviso = 'HOJE';
    } else if (diffDias < 0 && enviarApos) {
      tipoAviso = 'ATRASADO';
    }

    if (!tipoAviso) {
      return;
    }

    const conta = {
      idMensal,
      nomeConta,
      categoria: linha[3],
      tipoPessoa: linha[4],
      valorPrevisto,
      valorReal,
      vencimento: vencimentoDate,
      dataPagamento,
      pago,
      atrasado: linha[10],
      metodoPagamento: linha[11],
      origem: linha[12],
      notificacaoEnviada,
      observacoes: linha[14],
    };

    const assunto = `Aviso de pagamento: ${nomeConta} (${tipoAviso})`;
    const corpoHtml = templateEmail(conta, tipoAviso);
    MailApp.sendEmail({
      to: emails.join(','),
      subject: assunto,
      htmlBody: corpoHtml,
    });

    atualizacoes.push({ rowIndex: idx + 2, value: 'SIM' });
  });

  atualizacoes.forEach(({ rowIndex, value }) => {
    sheet.getRange(rowIndex, notificacaoColIndex).setValue(value);
  });
}

/**
 * Monta o corpo HTML do e-mail de notificação.
 *
 * @param {Object} conta Dados da conta mensal.
 * @param {string} tipoAviso Um dos valores: ANTES, HOJE, ATRASADO.
 * @returns {string} HTML do e-mail.
 */
function templateEmail(conta, tipoAviso) {
  const tz = Session.getScriptTimeZone();
  const statusLabel = tipoAviso === 'ANTES'
    ? 'Vencimento próximo'
    : tipoAviso === 'HOJE'
      ? 'Vence hoje'
      : 'Pagamento em atraso';
  const valor = conta.valorReal || conta.valorPrevisto || 0;
  const vencimentoFmt = conta.vencimento
    ? Utilities.formatDate(new Date(conta.vencimento), tz, 'dd/MM/yyyy')
    : '-';

  return `
    <div style="font-family: Arial, sans-serif; color: #222; line-height: 1.6;">
      <h2 style="margin:0 0 12px;">${statusLabel} — ${conta.nomeConta}</h2>
      <p style="margin:0 0 8px;">Status: <strong>${statusLabel}</strong></p>
      <p style="margin:0 0 8px;">Vencimento: <strong>${vencimentoFmt}</strong></p>
      <p style="margin:0 0 8px;">Valor: <strong>R$ ${Number(valor).toFixed(2)}</strong></p>
      <p style="margin:0 0 8px;">Método de pagamento: <strong>${conta.metodoPagamento || '-'} </strong></p>
      <hr style="margin:12px 0;" />
      <p style="margin:0 0 8px;">Link ou instruções de pagamento:</p>
      <p style="margin:0 0 12px;">${conta.observacoes || 'Realize o pagamento e atualize o status na planilha/webapp conforme o método indicado.'}</p>
      <p style="margin:0; color:#555;">Origem: ${conta.origem || '-'} | Categoria: ${conta.categoria || '-'} | Pessoa: ${conta.tipoPessoa || '-'} | ID: ${conta.idMensal}</p>
    </div>
  `;
}

/**
 * Gera uma pré-visualização do e-mail de notificação sem enviar.
 *
 * @param {string|number} id ID_MENSAL da linha na aba CONTAS_MENSAL.
 * @param {string} tipoAviso Tipo de aviso (ANTES, HOJE, ATRASADO).
 * @returns {string} HTML gerado.
 */
function previewNotificacao(id, tipoAviso) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = planilha.getSheetByName('CONTAS_MENSAL');
  if (!sheet) {
    throw new Error('Aba CONTAS_MENSAL não encontrada.');
  }
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    throw new Error('Nenhuma linha em CONTAS_MENSAL.');
  }
  const dados = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  const linha = dados.find(r => String(r[0]) === String(id));
  if (!linha) {
    throw new Error(`ID_MENSAL ${id} não encontrado.`);
  }
  const conta = {
    idMensal: linha[0],
    nomeConta: linha[2],
    categoria: linha[3],
    tipoPessoa: linha[4],
    valorPrevisto: linha[5],
    valorReal: linha[6],
    vencimento: linha[7],
    dataPagamento: linha[8],
    pago: linha[9],
    atrasado: linha[10],
    metodoPagamento: linha[11],
    origem: linha[12],
    notificacaoEnviada: linha[13],
    observacoes: linha[14],
  };
  const html = templateEmail(conta, (tipoAviso || '').toUpperCase());
  Logger.log(html);
  return html;
}
