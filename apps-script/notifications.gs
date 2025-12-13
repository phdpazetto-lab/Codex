/** Fluxos de notificação com auditoria em LOGS. */

function obterConfig(valor) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('CONFIG');
  if (!sheet) {
    throw new Error('Aba CONFIG não encontrada');
  }
  const data = sheet.getDataRange().getValues();
  const header = data[0];
  const valorIndex = header.indexOf(valor);
  if (valorIndex === -1) {
    throw new Error(`Configuração ${valor} não localizada`);
  }
  return data[1][valorIndex];
}

function obterDestinatarios() {
  const raw = obterConfig('EMAILS_NOTIFICACAO');
  return raw ? raw.split(';').map(function (email) { return email.trim(); }).filter(Boolean) : [];
}

function enviarAvisoVencimento(conta) {
  return executarComLog('Enviar aviso de vencimento', () => {
    const destinatarios = obterDestinatarios();
    if (destinatarios.length === 0) {
      throw new Error('Nenhum destinatário configurado para notificações');
    }

    const assunto = `Vencimento de conta: ${conta.nomeConta}`;
    const corpo = [
      `Conta: ${conta.nomeConta}`,
      `Valor previsto: ${conta.valorPrevisto}`,
      `Vencimento: ${conta.vencimento}`,
      conta.observacoes ? `Observações: ${conta.observacoes}` : ''
    ].filter(Boolean).join('\n');

    MailApp.sendEmail({
      to: destinatarios.join(','),
      subject: assunto,
      body: corpo
    });
    registrarEvento('INFO', 'Aviso de vencimento enviado', { contaId: conta.idMensal, destinatarios });
    return { contaId: conta.idMensal, destinatarios };
  }, { conta });
}

function notificarResumoDiario(contas) {
  return executarComLog('Enviar resumo diário', () => {
    const destinatarios = obterDestinatarios();
    if (destinatarios.length === 0) {
      throw new Error('Nenhum destinatário configurado para notificações');
    }

    const linhas = contas.map(function (conta) {
      return `${conta.nomeConta} - Vencimento ${conta.vencimento} - Valor ${conta.valorPrevisto}`;
    });

    const assunto = 'Resumo diário de contas';
    const corpo = linhas.join('\n');

    MailApp.sendEmail({
      to: destinatarios.join(','),
      subject: assunto,
      body: corpo
    });
    registrarEvento('INFO', 'Resumo diário enviado', { quantidade: contas.length, destinatarios });
    return { quantidade: contas.length, destinatarios };
  }, { quantidade: contas.length });
}
