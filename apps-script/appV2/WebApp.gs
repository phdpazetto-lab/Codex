/**
 * Web app entry and frontend endpoints.
 */
function doGet() {
  return HtmlService.createTemplateFromFile('appV2/Index')
    .evaluate()
    .setTitle('Finance Ops v2')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function apiEnsureAndList(monthRef, filters) {
  ensureMonthInstances(monthRef);
  var instances = listInstances(monthRef, filters || {});
  var kpis = computeMonthKpis(monthRef);
  return { instances: instances, kpis: kpis };
}

function apiAddOneOff(data) {
  return addOneOffInstance(data);
}

function apiMarkPaid(instanceId, actualValue, paidAt) {
  return markPaid(instanceId, actualValue, paidAt);
}

function apiPatchInstance(instanceId, patch) {
  return patchInstance(instanceId, patch);
}

function apiListRecurring() {
  return listRecurring(true);
}

function apiCreateRecurring(data) {
  return createRecurringBill(data);
}
