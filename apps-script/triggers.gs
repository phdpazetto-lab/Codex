const TRIGGERS_MONITORADOS = ['gerarMesAutomatico', 'enviarNotificacoesDiarias'];

function configurarTriggers() {
  removerTriggersAntigos();
  const horario = obterHorarioEnvioDiario();

  ScriptApp.newTrigger('gerarMesAutomatico')
    .timeBased()
    .atHour(horario.hour)
    .nearMinute(horario.minute)
    .onMonthDay(1)
    .create();

  ScriptApp.newTrigger('enviarNotificacoesDiarias')
    .timeBased()
    .atHour(horario.hour)
    .nearMinute(horario.minute)
    .everyDays(1)
    .create();
}

function removerTriggersAntigos() {
  const triggers = ScriptApp.getProjectTriggers();

  triggers.forEach((trigger) => {
    const handler = trigger.getHandlerFunction();
    if (TRIGGERS_MONITORADOS.includes(handler)) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

function obterHorarioEnvioDiario() {
  const fallback = { hour: 9, minute: 0 };
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  if (!planilha) {
    return fallback;
  }

  const abaConfig = planilha.getSheetByName('CONFIG');
  if (!abaConfig) {
    return fallback;
  }

  const valoresConfig = abaConfig.getRange('A:B').getValues();
  const linhaHora = valoresConfig.find((linha) => linha[0] === 'HORA_ENVIO_DIARIO');
  if (!linhaHora || !linhaHora[1]) {
    return fallback;
  }

  return interpretarHorario(linhaHora[1].toString(), fallback);
}

function interpretarHorario(textoHora, fallback) {
  const partes = textoHora.split(':');
  const hour = parseInt(partes[0], 10);
  const minute = parseInt(partes[1] || '0', 10);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return fallback;
  }

  return { hour, minute };
}
