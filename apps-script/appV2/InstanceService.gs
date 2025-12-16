/**
 * Materialization and operations for monthly instances.
 */
function instanceHeaders_() {
  return [
    'instance_id',
    'month_ref',
    'origin',
    'recurring_id',
    'name',
    'account',
    'category',
    'due_date',
    'predicted_value',
    'actual_value',
    'status',
    'paid_at',
    'payment_method',
    'supplier',
    'notes',
    'is_overdue',
    'created_at',
    'updated_at'
  ];
}

function ensureMonthInstances(monthRef) {
  validateMonthRef_(monthRef);
  var config = loadConfig();
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var existing = readTable_(SHEETS.INSTANCES).rows.filter(function (r) {
      return String(r.month_ref) === monthRef;
    });
    var existingKeys = {};
    existing.forEach(function (row) {
      var key = instanceKey_(row.recurring_id, monthRef, row.origin, row.instance_id);
      existingKeys[key] = true;
    });

    var recurring = listRecurring(true);
    var headers = instanceHeaders_();
    var tz = config.timezone || DEFAULTS.TIMEZONE;
    recurring.forEach(function (tmpl) {
      var key = instanceKey_(tmpl.recurring_id, monthRef, ENUMS.ORIGIN.RECURRING);
      if (existingKeys[key]) return;
      var dueDate = computeDueDate_(monthRef, tmpl.recurrence_day, config.shortMonthRule, tz);
      var now = new Date();
      var row = {
        instance_id: Utilities.getUuid(),
        month_ref: monthRef,
        origin: ENUMS.ORIGIN.RECURRING,
        recurring_id: tmpl.recurring_id,
        name: tmpl.name,
        account: tmpl.account,
        category: tmpl.category,
        due_date: dueDate,
        predicted_value: Number(tmpl.predicted_value),
        actual_value: '',
        status: ENUMS.STATUS.OPEN,
        paid_at: '',
        payment_method: tmpl.payment_method || '',
        supplier: tmpl.supplier || '',
        notes: tmpl.notes || '',
        is_overdue: computeOverdue_(dueDate, ENUMS.STATUS.OPEN, tz),
        created_at: now,
        updated_at: now
      };
      appendRow_(SHEETS.INSTANCES, headers, row);
    });
  } finally {
    lock.releaseLock();
  }
}

function addOneOffInstance(data) {
  validateMonthRef_(data.month_ref);
  validateOneOff_(data);
  var headers = instanceHeaders_();
  var now = new Date();
  var tz = (loadConfig().timezone || DEFAULTS.TIMEZONE);
  var due = new Date(data.due_date);
  var row = {
    instance_id: Utilities.getUuid(),
    month_ref: data.month_ref,
    origin: ENUMS.ORIGIN.ONE_OFF,
    recurring_id: '',
    name: data.name,
    account: data.account,
    category: data.category,
    due_date: due,
    predicted_value: Number(data.predicted_value),
    actual_value: data.actual_value || '',
    status: data.status || ENUMS.STATUS.OPEN,
    paid_at: data.paid_at || '',
    payment_method: data.payment_method || '',
    supplier: data.supplier || '',
    notes: data.notes || '',
    is_overdue: computeOverdue_(due, data.status || ENUMS.STATUS.OPEN, tz),
    created_at: now,
    updated_at: now
  };
  appendRow_(SHEETS.INSTANCES, headers, row);
  return row;
}

function listInstances(monthRef, filters) {
  validateMonthRef_(monthRef);
  var rows = readTable_(SHEETS.INSTANCES).rows.filter(function (r) {
    return String(r.month_ref) === monthRef;
  });
  filters = filters || {};
  if (filters.status) {
    rows = rows.filter(function (r) { return String(r.status) === String(filters.status); });
  }
  if (filters.account) {
    rows = rows.filter(function (r) { return String(r.account) === String(filters.account); });
  }
  if (filters.category) {
    rows = rows.filter(function (r) { return String(r.category) === String(filters.category); });
  }
  return rows;
}

function markPaid(instanceId, actualValue, paidAt) {
  var headers = instanceHeaders_();
  var table = readTable_(SHEETS.INSTANCES);
  var updated = false;
  var tz = loadConfig().timezone || DEFAULTS.TIMEZONE;
  table.rows.forEach(function (row) {
    if (String(row.instance_id) === String(instanceId)) {
      row.actual_value = actualValue !== undefined && actualValue !== null ? Number(actualValue) : row.actual_value;
      row.status = ENUMS.STATUS.PAID;
      row.paid_at = paidAt || new Date();
      row.is_overdue = computeOverdue_(row.due_date, row.status, tz);
      row.updated_at = new Date();
      updated = true;
    }
  });
  if (updated) {
    persistRows_(SHEETS.INSTANCES, headers, table.rows);
  }
  return updated;
}

function patchInstance(instanceId, patch) {
  var allowed = ['actual_value', 'notes', 'payment_method'];
  var headers = instanceHeaders_();
  var table = readTable_(SHEETS.INSTANCES);
  var updated = false;
  var tz = loadConfig().timezone || DEFAULTS.TIMEZONE;
  table.rows.forEach(function (row) {
    if (String(row.instance_id) === String(instanceId)) {
      allowed.forEach(function (field) {
        if (patch.hasOwnProperty(field)) {
          row[field] = field === 'actual_value' ? Number(patch[field]) : patch[field];
        }
      });
      if (patch.status === ENUMS.STATUS.CANCELLED) {
        row.status = ENUMS.STATUS.CANCELLED;
      }
      row.is_overdue = computeOverdue_(row.due_date, row.status, tz);
      row.updated_at = new Date();
      updated = true;
    }
  });
  if (updated) {
    persistRows_(SHEETS.INSTANCES, headers, table.rows);
  }
  return updated;
}

function persistRows_(sheetName, headers, rows) {
  var sheet = getSheet_(sheetName);
  sheet.clear();
  sheet.appendRow(headers);
  var data = rows.map(function (row) {
    return headers.map(function (h) {
      return row[h] === undefined || row[h] === null ? '' : row[h];
    });
  });
  if (data.length) {
    sheet.getRange(2, 1, data.length, headers.length).setValues(data);
  }
}

function instanceKey_(recurringId, monthRef, origin, instanceId) {
  if (origin === ENUMS.ORIGIN.ONE_OFF) {
    return 'ONE_OFF_' + instanceId;
  }
  return [recurringId, monthRef, origin].join('|');
}

function computeDueDate_(monthRef, recurrenceDay, shortMonthRule, tz) {
  var parts = monthRef.split('-');
  var year = Number(parts[0]);
  var month = Number(parts[1]) - 1; // JS month
  var day = Number(recurrenceDay);
  var lastDay = new Date(year, month + 1, 0).getDate();
  if (day > lastDay) {
    if (shortMonthRule === ENUMS.SHORT_MONTH_RULE.ROLL_NEXT_MONTH) {
      return new Date(year, month + 1, day);
    }
    day = lastDay; // clamp default
  }
  return new Date(year, month, day);
}

function computeOverdue_(dueDate, status, tz) {
  if (!dueDate) return false;
  if (status === ENUMS.STATUS.PAID || status === ENUMS.STATUS.CANCELLED) return false;
  var todayStr = getToday_(tz);
  var dueStr = Utilities.formatDate(new Date(dueDate), tz || DEFAULTS.TIMEZONE, 'yyyy-MM-dd');
  return dueStr < todayStr;
}

function validateMonthRef_(monthRef) {
  if (!monthRef || !/^\d{4}-\d{2}$/.test(monthRef)) {
    throw new Error('month_ref must follow YYYY-MM');
  }
}

function validateOneOff_(data) {
  var required = ['month_ref', 'due_date', 'predicted_value', 'status', 'name', 'account', 'category'];
  required.forEach(function (field) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      throw new Error('Missing field for one-off: ' + field);
    }
  });
}
