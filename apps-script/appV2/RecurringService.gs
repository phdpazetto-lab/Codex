/**
 * Recurring template management.
 */
function listRecurring(activeOnly) {
  var table = readTable_(SHEETS.RECURRING);
  var rows = table.rows;
  if (activeOnly) {
    rows = rows.filter(function (r) { return String(r.active).toUpperCase() === 'TRUE'; });
  }
  return rows;
}

function createRecurringBill(data) {
  validateRecurring_(data);
  var now = new Date();
  var row = {
    recurring_id: data.recurring_id || Utilities.getUuid(),
    name: data.name,
    account: data.account,
    category: data.category,
    recurrence_day: Number(data.recurrence_day),
    predicted_value: Number(data.predicted_value),
    value_rule: data.value_rule || ENUMS.VALUE_RULE.FIXED,
    payment_method: data.payment_method || '',
    supplier: data.supplier || '',
    notes: data.notes || '',
    active: data.active === false ? false : true,
    created_at: data.created_at || now,
    updated_at: now
  };
  appendRow_(SHEETS.RECURRING, recurringHeaders_(), row);
  return row;
}

function updateRecurringBill(recurringId, patch) {
  validateRecurring_(patch, true);
  patch.updated_at = new Date();
  return updateRowById_(SHEETS.RECURRING, 'recurring_id', recurringId, recurringHeaders_(), patch);
}

function recurringHeaders_() {
  return [
    'recurring_id',
    'name',
    'account',
    'category',
    'recurrence_day',
    'predicted_value',
    'value_rule',
    'payment_method',
    'supplier',
    'notes',
    'active',
    'created_at',
    'updated_at'
  ];
}

function validateRecurring_(data, isPartial) {
  if (!isPartial) {
    if (!data.name) throw new Error('name is required');
    if (!data.account) throw new Error('account is required');
    if (!data.category) throw new Error('category is required');
    if (data.recurrence_day === undefined || data.recurrence_day === null) {
      throw new Error('recurrence_day is required');
    }
    if (data.predicted_value === undefined || data.predicted_value === null) {
      throw new Error('predicted_value is required');
    }
  }
  if (data.recurrence_day !== undefined && data.recurrence_day !== null) {
    var day = Number(data.recurrence_day);
    if (day < 1 || day > 31) throw new Error('recurrence_day must be between 1 and 31');
  }
  if (data.value_rule && !ENUMS.VALUE_RULE[data.value_rule]) {
    throw new Error('value_rule must be FIXED or VARIABLE');
  }
}
