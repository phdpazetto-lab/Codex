/**
 * Config and enums for the finance system (SPEC v1.0).
 */
var SHEETS = {
  RECURRING: 'BILLS_RECURRING',
  INSTANCES: 'BILLS_INSTANCES',
  CONFIG: 'CONFIG',
  DASHBOARD: 'DASHBOARD_DATA'
};

var ENUMS = {
  STATUS: { OPEN: 'OPEN', PAID: 'PAID', CANCELLED: 'CANCELLED' },
  ORIGIN: { RECURRING: 'RECURRING', ONE_OFF: 'ONE_OFF' },
  VALUE_RULE: { FIXED: 'FIXED', VARIABLE: 'VARIABLE' },
  SHORT_MONTH_RULE: {
    CLAMP_LAST_DAY: 'CLAMP_LAST_DAY',
    ROLL_NEXT_MONTH: 'ROLL_NEXT_MONTH'
  }
};

var DEFAULTS = {
  TIMEZONE: 'America/Sao_Paulo',
  CURRENCY_LOCALE: 'pt-BR',
  MONTH_REF_FORMAT: 'YYYY-MM',
  SHORT_MONTH_RULE: ENUMS.SHORT_MONTH_RULE.CLAMP_LAST_DAY,
  DASHBOARD_TRIGGER_DAY: 1,
  DASHBOARD_TRIGGER_HOUR: 0
};

function loadConfig() {
  var sheet = SpreadsheetApp.getActive().getSheetByName(SHEETS.CONFIG);
  var result = {
    timezone: DEFAULTS.TIMEZONE,
    currencyLocale: DEFAULTS.CURRENCY_LOCALE,
    shortMonthRule: DEFAULTS.SHORT_MONTH_RULE,
    monthRefFormat: DEFAULTS.MONTH_REF_FORMAT,
    dashboardTriggerDay: DEFAULTS.DASHBOARD_TRIGGER_DAY,
    dashboardTriggerHour: DEFAULTS.DASHBOARD_TRIGGER_HOUR
  };
  if (!sheet) return result;
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return result;
  for (var i = 1; i < values.length; i++) {
    var key = String(values[i][0]).trim();
    var value = values[i][1];
    if (!key) continue;
    switch (key) {
      case 'timezone':
        result.timezone = value || result.timezone;
        break;
      case 'currency_locale':
        result.currencyLocale = value || result.currencyLocale;
        break;
      case 'short_month_rule':
        result.shortMonthRule = value || result.shortMonthRule;
        break;
      case 'month_ref_format':
        result.monthRefFormat = value || result.monthRefFormat;
        break;
      case 'dashboard_trigger_day':
        result.dashboardTriggerDay = Number(value || result.dashboardTriggerDay);
        break;
      case 'dashboard_trigger_hour':
        result.dashboardTriggerHour = Number(value || result.dashboardTriggerHour);
        break;
      default:
        break;
    }
  }
  return result;
}

function getToday_(tz) {
  var today = new Date();
  return Utilities.formatDate(today, tz || DEFAULTS.TIMEZONE, 'yyyy-MM-dd');
}
