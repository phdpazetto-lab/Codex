/**
 * Utility helpers for interacting with sheets and handling dates/config.
 */

/**
 * Returns a sheet by name from the active spreadsheet.
 * @param {string} name
 * @return {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getSheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

/**
 * Returns all values from the sheet's data range.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @return {Array<Array<*>>}
 */
function getDataRangeValues(sheet) {
  return sheet.getDataRange().getValues();
}

/**
 * Appends a row to the provided sheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {Array<*>} rowValues
 */
function writeRow(sheet, rowValues) {
  sheet.appendRow(rowValues);
}

/**
 * Updates a row at the given index with the provided values (starting at column 1).
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {number} rowIndex 1-based row index
 * @param {Array<*>} values
 */
function updateRow(sheet, rowIndex, values) {
  sheet.getRange(rowIndex, 1, 1, values.length).setValues([values]);
}

/**
 * Finds the first row where the id column matches the provided id.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {number} idCol 1-based column index where the id is stored
 * @param {*} id
 * @return {{rowIndex: number, values: Array<*>}|null}
 */
function findRowById(sheet, idCol, id) {
  var data = getDataRangeValues(sheet);
  for (var i = 1; i < data.length; i++) {
    if (data[i][idCol - 1] === id) {
      return { rowIndex: i + 1, values: data[i] };
    }
  }
  return null;
}

/**
 * Generates a unique id with the given prefix.
 * @param {string} prefix
 * @return {string}
 */
function generateId(prefix) {
  return prefix + '-' + Utilities.getUuid();
}

/**
 * Converts a value to a Date instance if possible.
 * @param {*} value
 * @return {Date|null}
 */
function toDate(value) {
  if (value instanceof Date) {
    return value;
  }
  var parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Returns today's date at the configured timezone with time set to midnight.
 * @return {Date}
 */
function todayAtTZ() {
  var config = loadConfig();
  var now = new Date();
  var tzNow = Utilities.formatDate(now, config.timezone, DATE_FORMAT);
  return toDate(tzNow);
}

/**
 * Loads and caches the CONFIG sheet into a structured object.
 * @return {{notificationEmails: string[], daysBeforeDue: number, sendOnDueDate: boolean, sendAfterDueDate: boolean, dailySendHour: string, timezone: string, controlMode: string}}
 */
function loadConfig() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get('CONFIG_CACHE');
  if (cached) {
    return JSON.parse(cached);
  }

  var sheet = getSheet(SHEET_NAMES.CONFIG);
  if (!sheet) {
    throw new Error('CONFIG sheet not found');
  }

  var values = getDataRangeValues(sheet);
  var configMap = {};
  for (var i = 1; i < values.length; i++) {
    var key = values[i][CONFIG_COLUMNS.PARAM - 1];
    var value = values[i][CONFIG_COLUMNS.VALUE - 1];
    if (key) {
      configMap[key] = value;
    }
  }

  var structuredConfig = {
    notificationEmails: (configMap[CONFIG_KEYS.EMAILS_NOTIFICACAO] || '').split(';').map(function(email) { return email.trim(); }).filter(String),
    daysBeforeDue: parseInt(configMap[CONFIG_KEYS.DIAS_ANTES_VENCIMENTO], 10) || 0,
    sendOnDueDate: String(configMap[CONFIG_KEYS.ENVIAR_NO_DIA_DO_VENCIMENTO]).toUpperCase() === 'SIM',
    sendAfterDueDate: String(configMap[CONFIG_KEYS.ENVIAR_AVISO_APOS_VENCIMENTO]).toUpperCase() === 'SIM',
    dailySendHour: configMap[CONFIG_KEYS.HORA_ENVIO_DIARIO] || '09:00',
    timezone: configMap[CONFIG_KEYS.FUSO_HORARIO] || Session.getScriptTimeZone(),
    controlMode: configMap[CONFIG_KEYS.MODO_CONTROLE_PF_PJ] || 'JUNTOS'
  };

  cache.put('CONFIG_CACHE', JSON.stringify(structuredConfig), 21600); // 6 hours
  return structuredConfig;
}
