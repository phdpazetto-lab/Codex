const SHEET_CONTAS_FIXAS = 'CONTAS_FIXAS';
const SHEET_CONTAS_MENSAL = 'CONTAS_MENSAL';

const CONTAS_MENSAL_HEADERS = [
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
  'OBSERVACOES',
];

function getSheetByName(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) {
    throw new Error('Sheet not found: ' + name);
  }
  return sheet;
}

function normalizeDate(dateInput) {
  const date = dateInput ? new Date(dateInput) : new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function sameMonth(date, reference) {
  return (
    date instanceof Date &&
    !isNaN(date) &&
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth()
  );
}

function buildMensalRowFromFixa(rowFixa, referenciaDate) {
  const vencimento = new Date(
    referenciaDate.getFullYear(),
    referenciaDate.getMonth(),
    Number(rowFixa[5]) || referenciaDate.getDate()
  );

  return [
    Utilities.getUuid(), // ID_MENSAL
    rowFixa[0], // ID_CONTA_ORIGEM
    rowFixa[1], // NOME_CONTA
    rowFixa[2], // CATEGORIA
    rowFixa[3], // TIPO_PESSOA
    rowFixa[4], // VALOR_PREVISTO
    '', // VALOR_REAL
    vencimento, // VENCIMENTO
    '', // DATA_PAGAMENTO
    'NAO', // PAGO
    'NAO', // ATRASADO (recalculado depois)
    rowFixa[6], // METODO_PAGAMENTO
    'FIXA', // ORIGEM
    'NAO', // NOTIFICACAO_ENVIADA
    rowFixa[7] || '', // OBSERVACOES
  ];
}

function getActiveFixedAccounts() {
  const sheet = getSheetByName(SHEET_CONTAS_FIXAS);
  const values = sheet.getDataRange().getValues();
  if (values.length === 0) {
    return [];
  }
  const [, ...rows] = values;
  return rows.filter((row) => (row[8] || '').toString().toUpperCase() === 'SIM');
}

function gerarMes(referenciaDate) {
  const referencia = normalizeDate(referenciaDate);

  const sheetMensal = getSheetByName(SHEET_CONTAS_MENSAL);
  const valuesMensal = sheetMensal.getDataRange().getValues();
  const hasData = valuesMensal.length > 0;
  const header = hasData ? valuesMensal[0] : CONTAS_MENSAL_HEADERS;
  const existingRows = hasData ? valuesMensal.slice(1) : [];

  const preservedVariavel = [];
  const rowsOutsideTargetMonth = [];

  existingRows.forEach((row) => {
    const vencimento = row[7];
    const origem = (row[12] || '').toString().toUpperCase();
    if (vencimento && sameMonth(vencimento, referencia)) {
      if (origem === 'VARIAVEL') {
        preservedVariavel.push(row);
      }
      // rows from the target month are cleared (fixed or otherwise)
    } else {
      rowsOutsideTargetMonth.push(row);
    }
  });

  const novasFixas = getActiveFixedAccounts().map((rowFixa) =>
    buildMensalRowFromFixa(rowFixa, referencia)
  );

  const newData = [
    header,
    ...rowsOutsideTargetMonth,
    ...preservedVariavel,
    ...novasFixas,
  ];

  sheetMensal.clearContents();
  if (newData.length > 0) {
    sheetMensal.getRange(1, 1, newData.length, header.length).setValues(newData);
  }

  recalcularAtrasos();
}

function recalcularAtrasos() {
  const hoje = normalizeDate();
  const sheet = getSheetByName(SHEET_CONTAS_MENSAL);
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return;
  }

  const header = values[0];
  const rows = values.slice(1);

  const updatedRows = rows.map((row) => {
    const pago = (row[9] || '').toString().toUpperCase();
    const vencimento = row[7];
    const atrasado =
      vencimento instanceof Date &&
      !isNaN(vencimento) &&
      vencimento.getTime() < hoje.getTime() &&
      pago !== 'SIM'
        ? 'SIM'
        : 'NAO';
    row[10] = atrasado;
    return row;
  });

  sheet.getRange(2, 1, updatedRows.length, header.length).setValues(updatedRows);
}

function criarContaPontual(payload) {
  const sheet = getSheetByName(SHEET_CONTAS_MENSAL);
  const vencimento = normalizeDate(payload.vencimento);

  const row = [
    Utilities.getUuid(), // ID_MENSAL
    'MANUAL', // ID_CONTA_ORIGEM
    payload.nomeConta || '', // NOME_CONTA
    payload.categoria || '', // CATEGORIA
    payload.tipoPessoa || '', // TIPO_PESSOA
    payload.valorPrevisto || '', // VALOR_PREVISTO
    payload.valorReal || '', // VALOR_REAL
    vencimento, // VENCIMENTO
    payload.dataPagamento || '', // DATA_PAGAMENTO
    'NAO', // PAGO
    'NAO', // ATRASADO
    payload.metodoPagamento || '', // METODO_PAGAMENTO
    'VARIAVEL', // ORIGEM
    'NAO', // NOTIFICACAO_ENVIADA
    payload.observacoes || '', // OBSERVACOES
  ];

  sheet.appendRow(row);
  recalcularAtrasos();
}
