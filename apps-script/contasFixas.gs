const CONTAS_FIXAS_SHEET_NAME = 'CONTAS_FIXAS';
const CONTAS_FIXAS_HEADERS = [
  'ID_CONTA',
  'NOME_CONTA',
  'CATEGORIA',
  'TIPO_PESSOA',
  'VALOR_PREVISTO',
  'DIA_RECORRENCIA',
  'METODO_PAGAMENTO',
  'OBSERVACOES',
  'ATIVA',
];

const STATUS_ATIVA = 'SIM';
const STATUS_INATIVA = 'NAO';

function getContasFixasSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(CONTAS_FIXAS_SHEET_NAME);

  if (!sheet) {
    throw new Error('Aba CONTAS_FIXAS não encontrada na planilha.');
  }

  return sheet;
}

function validarDiaRecorrencia_(valor) {
  const numero = Number(valor);

  if (!Number.isInteger(numero) || numero < 1 || numero > 28) {
    throw new Error('dia_recorrecia deve ser um número inteiro entre 1 e 28.');
  }

  return numero;
}

function validarValorPrevisto_(valor) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    throw new Error('valor_previsto deve ser um número.');
  }

  if (numero < 0) {
    throw new Error('valor_previsto não pode ser negativo.');
  }

  return numero;
}

function limparTexto_(valor) {
  return (valor || '').toString().trim();
}

function validarPayloadContaFixa_(payload, { requerId = false } = {}) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload inválido.');
  }

  const id = limparTexto_(
    payload.id || payload.id_conta || payload.ID_CONTA || ''
  );

  if (requerId && !id) {
    throw new Error('ID_CONTA é obrigatório.');
  }

  const nomeConta = limparTexto_(payload.nome_conta || payload.nome || '');
  if (!nomeConta) {
    throw new Error('nome_conta é obrigatório.');
  }

  const categoria = limparTexto_(payload.categoria || '');
  if (!categoria) {
    throw new Error('categoria é obrigatória.');
  }

  const tipoPessoa = limparTexto_(payload.tipo_pessoa || '').toUpperCase();
  if (!['PF', 'PJ'].includes(tipoPessoa)) {
    throw new Error('tipo_pessoa deve ser PF ou PJ.');
  }

  const valorPrevisto = validarValorPrevisto_(payload.valor_previsto);
  const diaRecorrencia = validarDiaRecorrencia_(payload.dia_recorrecia);
  const metodoPagamento = limparTexto_(payload.metodo_pagamento || '');
  const observacoes = limparTexto_(payload.observacoes || '');

  return {
    id,
    nomeConta,
    categoria,
    tipoPessoa,
    valorPrevisto,
    diaRecorrencia,
    metodoPagamento,
    observacoes,
  };
}

function gerarIdConta_() {
  return Utilities.getUuid();
}

function localizarLinhaPorId_(sheet, idConta) {
  const ultimaLinha = sheet.getLastRow();
  if (ultimaLinha < 2) {
    return null;
  }

  const ids = sheet
    .getRange(2, 1, ultimaLinha - 1, 1)
    .getValues()
    .map(function (linha) {
      return limparTexto_(linha[0]);
    });

  const indice = ids.indexOf(idConta);
  return indice === -1 ? null : indice + 2;
}

function listarContasFixas() {
  const sheet = getContasFixasSheet_();
  const ultimaLinha = sheet.getLastRow();

  if (ultimaLinha < 2) {
    return [];
  }

  const valores = sheet.getRange(2, 1, ultimaLinha - 1, CONTAS_FIXAS_HEADERS.length).getValues();

  return valores
    .filter(function (linha) {
      return limparTexto_(linha[8]) === STATUS_ATIVA;
    })
    .map(function (linha) {
      return {
        id_conta: limparTexto_(linha[0]),
        nome_conta: limparTexto_(linha[1]),
        categoria: limparTexto_(linha[2]),
        tipo_pessoa: limparTexto_(linha[3]),
        valor_previsto: Number(linha[4]),
        dia_recorrecia: Number(linha[5]),
        metodo_pagamento: limparTexto_(linha[6]),
        observacoes: limparTexto_(linha[7]),
        ativa: limparTexto_(linha[8]),
      };
    });
}

function criarContaFixa(payload) {
  const dados = validarPayloadContaFixa_(payload);
  const sheet = getContasFixasSheet_();
  const idConta = dados.id || gerarIdConta_();

  const novaLinha = [
    idConta,
    dados.nomeConta,
    dados.categoria,
    dados.tipoPessoa,
    dados.valorPrevisto,
    dados.diaRecorrencia,
    dados.metodoPagamento,
    dados.observacoes,
    STATUS_ATIVA,
  ];

  sheet.appendRow(novaLinha);

  return {
    id_conta: idConta,
    nome_conta: dados.nomeConta,
    categoria: dados.categoria,
    tipo_pessoa: dados.tipoPessoa,
    valor_previsto: dados.valorPrevisto,
    dia_recorrecia: dados.diaRecorrencia,
    metodo_pagamento: dados.metodoPagamento,
    observacoes: dados.observacoes,
    ativa: STATUS_ATIVA,
  };
}

function atualizarContaFixa(payload) {
  const dados = validarPayloadContaFixa_(payload, { requerId: true });
  const sheet = getContasFixasSheet_();
  const linha = localizarLinhaPorId_(sheet, dados.id);

  if (!linha) {
    throw new Error('Conta fixa não encontrada para atualização.');
  }

  const statusAtual = limparTexto_(
    sheet.getRange(linha, CONTAS_FIXAS_HEADERS.indexOf('ATIVA') + 1).getValue()
  ) || STATUS_ATIVA;

  const valoresAtualizados = [
    [
      dados.id,
      dados.nomeConta,
      dados.categoria,
      dados.tipoPessoa,
      dados.valorPrevisto,
      dados.diaRecorrencia,
      dados.metodoPagamento,
      dados.observacoes,
      statusAtual,
    ],
  ];

  sheet.getRange(linha, 1, 1, CONTAS_FIXAS_HEADERS.length).setValues(valoresAtualizados);

  return {
    id_conta: dados.id,
    nome_conta: dados.nomeConta,
    categoria: dados.categoria,
    tipo_pessoa: dados.tipoPessoa,
    valor_previsto: dados.valorPrevisto,
    dia_recorrecia: dados.diaRecorrencia,
    metodo_pagamento: dados.metodoPagamento,
    observacoes: dados.observacoes,
    ativa: statusAtual,
  };
}

function inativarContaFixa(id) {
  const idConta = limparTexto_(id);

  if (!idConta) {
    throw new Error('ID_CONTA é obrigatório para inativação.');
  }

  const sheet = getContasFixasSheet_();
  const linha = localizarLinhaPorId_(sheet, idConta);

  if (!linha) {
    throw new Error('Conta fixa não encontrada para inativação.');
  }

  const colunaAtiva = CONTAS_FIXAS_HEADERS.indexOf('ATIVA') + 1;
  sheet.getRange(linha, colunaAtiva).setValue(STATUS_INATIVA);

  return { id_conta: idConta, ativa: STATUS_INATIVA };
}
