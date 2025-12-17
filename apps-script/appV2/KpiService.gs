/**
 * KPI computation and persistence.
 */
function computeMonthKpis(monthRef) {
  validateMonthRef_(monthRef);
  var tz = (loadConfig().timezone || DEFAULTS.TIMEZONE);
  var table = readTable_(SHEETS.INSTANCES);
  var headers = instanceHeaders_();
  var rows = table.rows.filter(function (r) {
    return String(r.month_ref) === monthRef;
  });
  var updated = false;
  var totals = {
    month_ref: monthRef,
    total_predicted: 0,
    total_actual: 0,
    total_paid: 0,
    total_open: 0,
    total_overdue: 0,
    count_paid: 0,
    count_open: 0,
    count_overdue: 0,
    last_computed_at: new Date()
  };
  rows.forEach(function (row) {
    var predicted = parseFloat(row.predicted_value) || 0;
    var actual = parseFloat(row.actual_value);
    if (isNaN(actual)) actual = 0;
    var overdue = computeOverdue_(row.due_date, row.status, tz);
    if (String(row.is_overdue).toUpperCase() !== String(overdue).toUpperCase()) {
      row.is_overdue = overdue;
      row.updated_at = new Date();
      updated = true;
    }
    totals.total_predicted += predicted;
    if (row.status === ENUMS.STATUS.PAID) {
      var paidValue = actual || predicted;
      totals.total_paid += paidValue;
      totals.count_paid += 1;
    }
    if (row.status === ENUMS.STATUS.OPEN) {
      totals.total_open += predicted;
      totals.count_open += 1;
    }
    if (overdue) {
      totals.total_overdue += predicted;
      totals.count_overdue += 1;
    }
    totals.total_actual += actual;
  });
  if (updated) {
    persistRows_(SHEETS.INSTANCES, headers, table.rows);
  }
  persistKpi_(totals);
  return totals;
}

function persistKpi_(totals) {
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
  upsertByKey_(SHEETS.DASHBOARD, 'month_ref', totals.month_ref, headers, totals);
}
