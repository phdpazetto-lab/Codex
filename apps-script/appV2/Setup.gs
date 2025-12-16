/**
 * Setup utilities to create the required sheets with correct headers and defaults.
 * Run `setupSheets()` once in the Apps Script editor to initialize a new Spreadsheet
 * according to SPEC v1.0.
 */
function setupSheets() {
  var summary = [];
  summary.push(setupTable_(SHEETS.RECURRING, recurringHeaders_()));
  summary.push(setupTable_(SHEETS.INSTANCES, instanceHeaders_()));
  summary.push(setupConfig_());
  summary.push(setupDashboard_());
  return summary;
}

function setupTable_(sheetName, headers) {
  var sheet = getSheet_(sheetName);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow === 0 || lastCol === 0) {
    sheet.appendRow(headers);
    return 'Created sheet ' + sheetName + ' with headers';
  }
  var existing = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  if (existing.join('|') !== headers.join('|')) {
    sheet.clear();
    sheet.appendRow(headers);
    return 'Reset sheet ' + sheetName + ' headers to match SPEC';
  }
  return 'Sheet ' + sheetName + ' already aligned';
}

function setupConfig_() {
  var headers = ['key', 'value'];
  var sheet = getSheet_(SHEETS.CONFIG);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else {
    var existing = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    if (existing.join('|') !== headers.join('|')) {
      sheet.clear();
      sheet.appendRow(headers);
    }
  }
  var defaults = [
    ['timezone', DEFAULTS.TIMEZONE],
    ['currency_locale', DEFAULTS.CURRENCY_LOCALE],
    ['short_month_rule', DEFAULTS.SHORT_MONTH_RULE],
    ['month_ref_format', DEFAULTS.MONTH_REF_FORMAT],
    ['dashboard_trigger_day', DEFAULTS.DASHBOARD_TRIGGER_DAY],
    ['dashboard_trigger_hour', DEFAULTS.DASHBOARD_TRIGGER_HOUR]
  ];
  var existingKeys = {};
  var current = sheet.getDataRange().getValues();
  for (var i = 1; i < current.length; i++) {
    existingKeys[String(current[i][0]).trim()] = true;
  }
  defaults.forEach(function (pair) {
    if (!existingKeys[pair[0]]) {
      sheet.appendRow(pair);
    }
  });
  return 'CONFIG ready with defaults';
}

function setupDashboard_() {
  var headers = [
    'month_ref',
    'total_predicted',
    'total_actual',
    'total_paid',
    'total_open',
    'total_overdue',
    'count_paid',
    'count_open',
    'count_overdue',
    'last_computed_at'
  ];
  return setupTable_(SHEETS.DASHBOARD, headers);
}
