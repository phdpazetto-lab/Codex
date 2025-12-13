/** Utilidades para CRUD das abas CONTAS_FIXAS e CONTAS_MENSAL. */

const HEADERS_CONTAS_FIXAS = [
  'ID_CONTA',
  'NOME_CONTA',
  'CATEGORIA',
  'TIPO_PESSOA',
  'VALOR_PREVISTO',
  'DIA_RECORRENCIA',
  'METODO_PAGAMENTO',
  'OBSERVACOES',
  'ATIVA'
];

const HEADERS_CONTAS_MENSAL = [
  'ID_MENSAL',
  'ID_CONTA_ORIGEM',
  'NOME_CONTA',
  'CATEGORIA',
  'TIPO_PESSOA',
  'VALOR_PREVISTO',
  'VALOR_REAL',
  'VENCIMENTO',
  'DATA_PAGAMENTO',
  'PAGO',
  'ATRASADO',
  'METODO_PAGAMENTO',
  'ORIGEM',
  'NOTIFICACAO_ENVIADA',
  'OBSERVACOES'
];

function getSheetOrCreate(name, headers) {
  return executarComLog(`Preparar aba ${name}`, () => {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
    }
    return sheet;
  });
}

function gerarId(prefixo) {
  return `${prefixo}-${new Date().getTime()}`;
}

function criarContaFixa(conta) {
  return executarComLog('Criar Conta Fixa', () => {
    const sheet = getSheetOrCreate('CONTAS_FIXAS', HEADERS_CONTAS_FIXAS);
    const id = gerarId('CF');
    const linha = [
      id,
      conta.nomeConta || '',
      conta.categoria || '',
      conta.tipoPessoa || '',
      conta.valorPrevisto || 0,
      conta.diaRecorrencia || '',
      conta.metodoPagamento || '',
      conta.observacoes || '',
      'SIM'
    ];
    sheet.appendRow(linha);
    return { id, linha };
  }, { conta });
}

function criarContaMensal(conta) {
  return executarComLog('Criar Conta Mensal', () => {
    const sheet = getSheetOrCreate('CONTAS_MENSAL', HEADERS_CONTAS_MENSAL);
    const id = gerarId('CM');
    const linha = [
      id,
      conta.idContaOrigem || 'MANUAL',
      conta.nomeConta || '',
      conta.categoria || '',
      conta.tipoPessoa || '',
      conta.valorPrevisto || 0,
      conta.valorReal || '',
      conta.vencimento || '',
      conta.dataPagamento || '',
      conta.pago || 'NAO',
      conta.atrasado || 'NAO',
      conta.metodoPagamento || '',
      conta.origem || '',
      conta.notificacaoEnviada || 'NAO',
      conta.observacoes || ''
    ];
    sheet.appendRow(linha);
    return { id, linha };
  }, { conta });
}

function atualizarContaMensal(idMensal, atualizacoes) {
  return executarComLog('Atualizar Conta Mensal', () => {
    const sheet = getSheetOrCreate('CONTAS_MENSAL', HEADERS_CONTAS_MENSAL);
    const values = sheet.getDataRange().getValues();
    const header = values[0];
    const rowIndex = values.findIndex((row, idx) => idx > 0 && row[0] === idMensal);

    if (rowIndex === -1) {
      throw new Error(`Conta mensal ${idMensal} não encontrada`);
    }

    const row = values[rowIndex];
    Object.keys(atualizacoes || {}).forEach(function (campo) {
      const colIndex = header.indexOf(campo);
      if (colIndex !== -1) {
        row[colIndex] = atualizacoes[campo];
      }
    });

    sheet.getRange(rowIndex + 1, 1, 1, row.length).setValues([row]);
    return { idMensal, atualizacoes };
  }, { idMensal, atualizacoes });
}

function excluirContaMensal(idMensal) {
  return executarComLog('Excluir Conta Mensal', () => {
    const sheet = getSheetOrCreate('CONTAS_MENSAL', HEADERS_CONTAS_MENSAL);
    const values = sheet.getDataRange().getValues();
    const rowIndex = values.findIndex((row, idx) => idx > 0 && row[0] === idMensal);

    if (rowIndex === -1) {
      throw new Error(`Conta mensal ${idMensal} não encontrada`);
    }

    sheet.deleteRow(rowIndex + 1);
    return { idMensal };
  }, { idMensal });
}

function registrarPagamento(idMensal, valorReal, dataPagamento) {
  return executarComLog('Registrar Pagamento', () => {
    const sheet = getSheetOrCreate('CONTAS_MENSAL', HEADERS_CONTAS_MENSAL);
    const values = sheet.getDataRange().getValues();
    const header = values[0];
    const rowIndex = values.findIndex((row, idx) => idx > 0 && row[0] === idMensal);

    if (rowIndex === -1) {
      throw new Error(`Conta mensal ${idMensal} não encontrada`);
    }

    const pagoIndex = header.indexOf('PAGO');
    const valorRealIndex = header.indexOf('VALOR_REAL');
    const dataPagamentoIndex = header.indexOf('DATA_PAGAMENTO');
    const atrasadoIndex = header.indexOf('ATRASADO');

    const row = values[rowIndex];
    row[pagoIndex] = 'SIM';
    row[valorRealIndex] = valorReal;
    row[dataPagamentoIndex] = dataPagamento || new Date();
    row[atrasadoIndex] = 'NAO';

    sheet.getRange(rowIndex + 1, 1, 1, row.length).setValues([row]);
    return { idMensal, valorReal };
  }, { idMensal, valorReal, dataPagamento });
}
