/**
 * Lightweight sheet helpers with header-based mapping.
 */
function getSheet_(name) {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function readTable_(sheetName) {
  var sheet = getSheet_(sheetName);
  var values = sheet.getDataRange().getValues();
  if (!values.length) return { headers: [], rows: [] };
  var headers = values[0].map(String);
  var rows = values.slice(1).map(function (row) {
    var obj = {};
    headers.forEach(function (h, idx) {
      obj[h] = row[idx];
    });
    return obj;
  });
  return { headers: headers, rows: rows };
}

function appendRow_(sheetName, headers, rowObj) {
  var sheet = getSheet_(sheetName);
  if (!sheet.getLastRow()) {
    sheet.appendRow(headers);
  } else {
    // ensure headers exist
    var existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (existingHeaders.join('|') !== headers.join('|')) {
      sheet.clear();
      sheet.appendRow(headers);
    }
  }
  var row = headers.map(function (h) {
    return rowObj[h] === undefined || rowObj[h] === null ? '' : rowObj[h];
  });
  sheet.appendRow(row);
}

function updateRowById_(sheetName, idColumn, idValue, headers, patch) {
  var sheet = getSheet_(sheetName);
  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  if (values.length < 2) return false;
  var headerRow = values[0];
  var idIndex = headerRow.indexOf(idColumn);
  if (idIndex === -1) return false;
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][idIndex]) === String(idValue)) {
      headers.forEach(function (h, idx) {
        if (patch.hasOwnProperty(h)) {
          values[i][idx] = patch[h];
        }
      });
      sheet.getRange(1, 1, values.length, headerRow.length).setValues(values);
      return true;
    }
  }
  return false;
}

function upsertByKey_(sheetName, keyColumn, keyValue, headers, rowObj) {
  var sheet = getSheet_(sheetName);
  var values = sheet.getDataRange().getValues();
  if (!values.length) {
    sheet.appendRow(headers);
    var row = headers.map(function (h) {
      return rowObj[h] === undefined || rowObj[h] === null ? '' : rowObj[h];
    });
    sheet.appendRow(row);
    return;
  }
  var headerRow = values[0];
  var keyIndex = headerRow.indexOf(keyColumn);
  if (keyIndex === -1) {
    sheet.clear();
    sheet.appendRow(headers);
    var rowNew = headers.map(function (h2) {
      return rowObj[h2] === undefined || rowObj[h2] === null ? '' : rowObj[h2];
    });
    sheet.appendRow(rowNew);
    return;
  }
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][keyIndex]) === String(keyValue)) {
      headers.forEach(function (h, idx) {
        values[i][idx] = rowObj[h] === undefined || rowObj[h] === null ? '' : rowObj[h];
      });
      sheet.getRange(1, 1, values.length, headerRow.length).setValues(values);
      return;
    }
  }
  var rowFinal = headers.map(function (h3) {
    return rowObj[h3] === undefined || rowObj[h3] === null ? '' : rowObj[h3];
  });
  sheet.appendRow(rowFinal);
}
