/**
 * Registra eventos na aba LOGS com data/hora, tipo e payload opcional.
 * @param {string} tipo - Tipo do evento (INFO, SUCCESS, ERROR etc.).
 * @param {string} mensagem - Descrição resumida do evento.
 * @param {Object} [payload] - Dados adicionais para auditoria.
 */
function registrarEvento(tipo, mensagem, payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = 'LOGS';
  const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['timestamp', 'tipo', 'mensagem', 'payload']);
  }

  const timestamp = Utilities.formatDate(
    new Date(),
    ss.getSpreadsheetTimeZone(),
    "yyyy-MM-dd'T'HH:mm:ssXXX"
  );
  const serializedPayload = payload !== undefined ? JSON.stringify(payload) : '';

  sheet.appendRow([timestamp, tipo, mensagem, serializedPayload]);
}

/**
 * Executa uma ação com logs de início, sucesso e erro.
 * @param {string} acao - Nome da ação para auditoria.
 * @param {Function} callback - Função a ser executada.
 * @param {Object} [contexto] - Contexto adicional para logging.
 * @returns {*}
 */
function executarComLog(acao, callback, contexto) {
  registrarEvento('INFO', `${acao} iniciado`, contexto);

  try {
    const resultado = callback();
    registrarEvento('SUCCESS', `${acao} concluído`, { contexto, resultado });
    return resultado;
  } catch (error) {
    registrarEvento('ERROR', `${acao} falhou: ${error.message}`, { contexto });
    throw error;
  }
}
