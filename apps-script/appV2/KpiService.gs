/**
 * KPI computation and persistence.
 */
function computeMonthKpis(monthRef) {
  validateMonthRef_(monthRef);
  var headers = instanceHeaders_();
  var rows = readTable_(SHEETS.INSTANCES).rows.filter(function (r) {
    return String(r.month_ref) === monthRef;
  });
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
    var predicted = Number(row.predicted_value) || 0;
    var actual = Number(row.actual_value) || 0;
    totals.total_predicted += predicted;
    if (row.status === ENUMS.STATUS.PAID) {
      totals.total_paid += actual || predicted;
      totals.count_paid += 1;
    }
    if (row.status === ENUMS.STATUS.OPEN) {
      totals.total_open += predicted;
      totals.count_open += 1;
    }
    if (String(row.is_overdue) === 'TRUE' || row.is_overdue === true) {
      totals.total_overdue += predicted;
      totals.count_overdue += 1;
    }
    totals.total_actual += actual;
  });
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
