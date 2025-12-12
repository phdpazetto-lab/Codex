const CONFIG_HEADERS = ['PARAMETRO', 'VALOR'];
const CONTAS_FIXAS_HEADERS = [
  'ID_CONTA',
  'NOME_CONTA',
  'CATEGORIA',
  'TIPO_PESSOA (PF/PJ)',
  'VALOR_PREVISTO',
  'DIA_RECORRENCIA',
  'METODO_PAGAMENTO',
  'OBSERVACOES',
  'ATIVA (SIM/NÃO)'
];
const CONTAS_MENSAL_HEADERS = [
  'ID_MENSAL',
  'ID_CONTA_ORIGEM',
  'NOME_CONTA',
  'CATEGORIA',
  'TIPO_PESSOA',
  'VALOR_PREVISTO',
  'VALOR_REAL',
  'VENCIMENTO (data)',
  'DATA_PAGAMENTO',
  'PAGO (SIM/NÃO)',
  'ATRASADO (SIM/NÃO)',
  'METODO_PAGAMENTO',
  'ORIGEM (FIXA/VARIAVEL)',
  'NOTIFICACAO_ENVIADA',
  'OBSERVACOES'
];
const LOGS_HEADERS = ['TIMESTAMP', 'EVENTO', 'DETALHES', 'USUARIO'];

function createOrResetSpreadsheet(spreadsheetId, spreadsheetName) {
  const ss = getOrCreateSpreadsheet(spreadsheetId, spreadsheetName);
  const requiredSheets = [
    { name: 'CONFIG', headers: CONFIG_HEADERS },
    { name: 'CONTAS_FIXAS', headers: CONTAS_FIXAS_HEADERS },
    { name: 'CONTAS_MENSAL', headers: CONTAS_MENSAL_HEADERS },
    { name: 'LOGS', headers: LOGS_HEADERS, optional: true }
  ];

  requiredSheets.forEach(({ name, headers, optional }) => {
    const sheet = upsertSheet(ss, name, headers);
    if (!optional || sheet) {
      protectHeaders(sheet, headers.length);
    }
  });

  removeUnexpectedSheets(ss, requiredSheets.map(({ name }) => name));

  return ss.getUrl();
}

function seedConfig(spreadsheetId) {
  const ss = getOrCreateSpreadsheet(spreadsheetId);
  const sheet = ss.getSheetByName('CONFIG') || upsertSheet(ss, 'CONFIG', CONFIG_HEADERS);
  const values = [
    ['EMAILS_NOTIFICACAO', 'admin@empresa.com;operador1@empresa.com;operador2@empresa.com'],
    ['DIAS_ANTES_VENCIMENTO', 3],
    ['ENVIAR_NO_DIA_DO_VENCIMENTO', 'SIM'],
    ['ENVIAR_AVISO_APOS_VENCIMENTO', 'SIM'],
    ['HORA_ENVIO_DIARIO', '09:00'],
    ['FUSO_HORARIO', 'America/Sao_Paulo'],
    ['MODO_CONTROLE_PF_PJ', 'JUNTOS']
  ];

  sheet.getRange(2, 1, values.length, CONFIG_HEADERS.length).setValues(values);
  return ss.getUrl();
}

function seedDemoData(spreadsheetId) {
  const ss = getOrCreateSpreadsheet(spreadsheetId);
  const fixedSheet = ss.getSheetByName('CONTAS_FIXAS') || upsertSheet(ss, 'CONTAS_FIXAS', CONTAS_FIXAS_HEADERS);
  const monthlySheet = ss.getSheetByName('CONTAS_MENSAL') || upsertSheet(ss, 'CONTAS_MENSAL', CONTAS_MENSAL_HEADERS);

  const fixedRows = [
    ['CF-001', 'Aluguel Escritório', 'Operacional', 'PJ', 3500, 5, 'PIX', 'Aluguel mensal do escritório', 'SIM'],
    ['CF-002', 'Internet e Telefonia', 'Operacional', 'PJ', 450, 10, 'Cartão de Crédito', 'Plano corporativo', 'SIM'],
    ['CF-003', 'Software de Gestão', 'Tecnologia', 'PJ', 299, 15, 'Cartão de Crédito', 'Licenças mensais', 'SIM']
  ];

  const monthRows = [
    ['M-2024-001', 'CF-001', 'Aluguel Escritório', 'Operacional', 'PJ', 3500, '', new Date(2024, 6, 5), '', 'NÃO', 'NÃO', 'PIX', 'FIXA', 'NÃO', 'Vencimento no início do mês'],
    ['M-2024-002', 'MANUAL', 'Compra de Materiais', 'Operacional', 'PF', 650, '', new Date(2024, 6, 18), '', 'NÃO', 'NÃO', 'Cartão de Crédito', 'VARIAVEL', 'NÃO', 'Material de escritório']
  ];

  fixedSheet.getRange(2, 1, fixedRows.length, CONTAS_FIXAS_HEADERS.length).setValues(fixedRows);
  monthlySheet.getRange(2, 1, monthRows.length, CONTAS_MENSAL_HEADERS.length).setValues(monthRows);

  return ss.getUrl();
}

function getOrCreateSpreadsheet(spreadsheetId, spreadsheetName) {
  if (spreadsheetId) {
    return SpreadsheetApp.openById(spreadsheetId);
  }

  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    return active;
  }

  const name = spreadsheetName || 'StarPay - Controle de Contas';
  return SpreadsheetApp.create(name);
}

function upsertSheet(spreadsheet, name, headers) {
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
  } else {
    sheet.clearContents();
    sheet.clearFormats();
  }

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  return sheet;
}

function protectHeaders(sheet, headerLength) {
  const range = sheet.getRange(1, 1, 1, headerLength);
  const protections = sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE);
  protections.forEach((protection) => {
    const protectedRange = protection.getRange();
    if (protectedRange.getRow() === 1 && protectedRange.getLastRow() === 1) {
      protection.remove();
    }
  });

  const protection = range.protect().setDescription(`${sheet.getName()} headers`);
  const me = Session.getEffectiveUser();
  protection.addEditor(me);
  protection.removeEditors(
    protection.getEditors().filter((editor) => editor.getEmail && editor.getEmail() !== me.getEmail())
  );
  if (protection.canDomainEdit()) {
    protection.setDomainEdit(false);
  }
}

function removeUnexpectedSheets(spreadsheet, expectedNames) {
  const sheets = spreadsheet.getSheets();
  sheets.forEach((sheet) => {
    if (expectedNames.indexOf(sheet.getName()) === -1) {
      spreadsheet.deleteSheet(sheet);
    }
  });
}

// Convenience function to fully prepare a spreadsheet (create/reset + seed data).
// Usage in the Apps Script editor:
// 1) Open the project, pick this file, and run `setupDemoSpreadsheet()`.
// 2) Approve authorization prompts. The function returns the spreadsheet URL for reference.
function setupDemoSpreadsheet(spreadsheetId, spreadsheetName) {
  const url = createOrResetSpreadsheet(spreadsheetId, spreadsheetName);
  seedConfig(spreadsheetId);
  seedDemoData(spreadsheetId);
  return url;
}
