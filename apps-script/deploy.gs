/**
 * HTML service bootstrap for the StarPay WebApp.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('StarPay')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
