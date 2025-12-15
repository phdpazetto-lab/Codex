/**
 * Utilidades e funções de controle da aba CONTAS_MENSAL.
 * Implementação em Google Apps Script.
 */

const CONTAS_MENSAL_SHEET = 'CONTAS_MENSAL';

// Normalização de cabeçalhos para suportar variações mantendo chaves canônicas no código.
const CONTAS_MENSAL_HEADER_ALIASES = {
  IDMENSAL: 'ID_MENSAL',
  ID_CONTA_ORIGEM: 'ID_CONTA_ORIGEM',
  IDCONTAORIGEM: 'ID_CONTA_ORIGEM',
  NOMECONTA: 'NOME_CONTA',
  CATEGORIA: 'CATEGORIA',
  TIPOPESSOA: 'TIPO_PESSOA',
  VALORPREVISTO: 'VALOR_PREVISTO',
  VALORREAL: 'VALOR_REAL',
  VENCIMENTO: 'VENCIMENTO',
  VENCIMENTODATA: 'VENCIMENTO',
  DATAPAGAMENTO: 'DATA_PAGAMENTO',
  PAGO: 'PAGO',
  PAGOSIMNAO: 'PAGO',
  ATRASADO: 'ATRASADO',
  ATRASADOSIMNAO: 'ATRASADO',
  METODOPAGAMENTO: 'METODO_PAGAMENTO',
  ORIGEM: 'ORIGEM',
  ORIGEMFIXAVARIAVEL: 'ORIGEM',
  NOTIFICACAOENVIADA: 'NOTIFICACAO_ENVIADA',
  OBSERVACOES: 'OBSERVACOES'
};

function normalizeSheetName(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^A-Z0-9]/gi, '')
    .toUpperCase();
}

/** Obtém a planilha de contas do mês, tolerando variações de maiúsculas/acentos. */
function getContasMensalSheet() {
  const ss = SpreadsheetApp.getActive();

  const exact = ss.getSheetByName(CONTAS_MENSAL_SHEET);
  if (exact) return exact;

  const normalizedTarget = normalizeSheetName(CONTAS_MENSAL_SHEET);
  const fallback = ss.getSheets().find((sheet) => normalizeSheetName(sheet.getName()) === normalizedTarget);
  if (fallback) return fallback;

  const disponiveis = ss
    .getSheets()
    .map((s) => s.getName())
    .join(', ');
  throw new Error('Aba CONTAS_MENSAL não encontrada. Planilhas disponíveis: ' + disponiveis);
}

/** Normaliza texto de cabeçalho removendo acentos e espaços. */
function normalizeHeaderKey(name) {
  if (!name) return '';
  const normalized = String(name)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^A-Z0-9]/gi, '')
    .toUpperCase();
  return CONTAS_MENSAL_HEADER_ALIASES[normalized] || normalized;
}

/** Cria um mapa "nome da coluna" -> índice para leitura/escrita. */
function getHeaderMap(sheet) {
  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  header.forEach((name, idx) => {
    const key = normalizeHeaderKey(name);
    if (key) {
      map[key] = idx;
    }
  });
  return map;
}

/** Converte valor diverso para SIM/NAO. */
function toSimNao(value) {
  const normalized = String(value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase();
  return normalized === 'SIM' || normalized === 'TRUE' || normalized === 'YES' ? 'SIM' : 'NAO';
}

/** Remove horário para comparações de data. */
function normalizeDate(date) {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d)) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Calcula se a conta está atrasada. */
function calcularAtraso(vencimento, pagoSimNao, dataPagamento) {
  const venc = normalizeDate(vencimento);
  const pagamento = normalizeDate(dataPagamento);
  if (!venc) return 'NAO';

  const pago = toSimNao(pagoSimNao) === 'SIM';
  if (pago) {
    if (pagamento && pagamento > venc) return 'SIM';
    return 'NAO';
  }

  const hoje = normalizeDate(new Date());
  return hoje > venc ? 'SIM' : 'NAO';
}

/** Converte uma linha em objeto usando o header map. */
function mapRowToObject(row, headerMap) {
  const obj = {};
  Object.keys(headerMap).forEach((key) => {
    obj[key] = row[headerMap[key]];
  });
  return obj;
}

/**
 * Lista contas do mês com filtros opcionais.
 * @param {Object} filtros
 * @param {string} [filtros.status] - PAGO | ATRASADO | PENDENTE/EM_ABERTO
 * @param {string|string[]} [filtros.categoria]
 * @param {string} [filtros.tipoPessoa] - PF | PJ
 * @param {string|Date} [filtros.vencimentoInicio]
 * @param {string|Date} [filtros.vencimentoFim]
 * @returns {Object[]} Lista de linhas como objetos chaveados pelo cabeçalho.
 */
function listarContasMes(filtros) {
  const sheet = getContasMensalSheet();
  const headerMap = getHeaderMap(sheet);
  const data = sheet.getDataRange().getValues();
  const rows = data.slice(1); // ignora cabeçalho

  const statusFiltro = filtros && filtros.status ? String(filtros.status).toUpperCase() : '';
  const categoriaFiltro = filtros && filtros.categoria
    ? Array.isArray(filtros.categoria)
      ? filtros.categoria.map(String)
      : [String(filtros.categoria)]
    : null;
  const tipoPessoaFiltro = filtros && filtros.tipoPessoa ? String(filtros.tipoPessoa).toUpperCase() : '';
  const vencInicio = filtros ? normalizeDate(filtros.vencimentoInicio) : null;
  const vencFim = filtros ? normalizeDate(filtros.vencimentoFim) : null;

  return rows
    .map((row) => mapRowToObject(row, headerMap))
    .filter((row) => {
      row.ATRASADO = calcularAtraso(row.VENCIMENTO, row.PAGO, row.DATA_PAGAMENTO);

      if (statusFiltro === 'PAGO' && toSimNao(row.PAGO) !== 'SIM') return false;
      if ((statusFiltro === 'PENDENTE' || statusFiltro === 'EM_ABERTO') && toSimNao(row.PAGO) === 'SIM') return false;
      if (statusFiltro === 'ATRASADO' && row.ATRASADO !== 'SIM') return false;

      if (categoriaFiltro && !categoriaFiltro.some((cat) => String(row.CATEGORIA).toUpperCase() === String(cat).toUpperCase())) return false;
      if (tipoPessoaFiltro && String(row.TIPO_PESSOA).toUpperCase() !== tipoPessoaFiltro) return false;

      const vencimento = normalizeDate(row.VENCIMENTO);
      if (vencInicio && (!vencimento || vencimento < vencInicio)) return false;
      if (vencFim && (!vencimento || vencimento > vencFim)) return false;

      return true;
    });
}

/**
 * Marca uma conta como paga atualizando campos principais.
 * @param {string|number} id
 * @param {Date|string} dataPagamento
 * @param {number} valorReal
 * @param {string} metodo
 * @param {string} observacoes
 * @returns {Object} Linha atualizada.
 */
function marcarPago(id, dataPagamento, valorReal, metodo, observacoes) {
  const sheet = getContasMensalSheet();
  const headerMap = getHeaderMap(sheet);
  const data = sheet.getDataRange().getValues();

  const targetIdx = data.findIndex((row, idx) => idx > 0 && String(row[headerMap.ID_MENSAL]) === String(id));
  if (targetIdx === -1) {
    throw new Error('Conta não encontrada para o ID informado.');
  }

  const row = data[targetIdx];
  row[headerMap.DATA_PAGAMENTO] = dataPagamento ? new Date(dataPagamento) : new Date();
  if (valorReal !== undefined && valorReal !== null) row[headerMap.VALOR_REAL] = valorReal;
  if (metodo) row[headerMap.METODO_PAGAMENTO] = metodo;
  if (observacoes) row[headerMap.OBSERVACOES] = observacoes;

  row[headerMap.PAGO] = 'SIM';
  row[headerMap.ATRASADO] = calcularAtraso(row[headerMap.VENCIMENTO], row[headerMap.PAGO], row[headerMap.DATA_PAGAMENTO]);
  row[headerMap.NOTIFICACAO_ENVIADA] = row[headerMap.NOTIFICACAO_ENVIADA] || 'SIM';

  sheet.getRange(targetIdx + 1, 1, 1, sheet.getLastColumn()).setValues([row]);

  return mapRowToObject(row, headerMap);
}

/**
 * Atualiza uma linha da aba CONTAS_MENSAL.
 * @param {Object} payload
 * @param {string|number} payload.id
 * @returns {Object} Linha atualizada.
 */
function atualizarContaMensal(payload) {
  if (!payload || payload.id === undefined || payload.id === null) {
    throw new Error('Payload inválido: id obrigatório.');
  }

  const sheet = getContasMensalSheet();
  const headerMap = getHeaderMap(sheet);
  const data = sheet.getDataRange().getValues();

  const targetIdx = data.findIndex((row, idx) => idx > 0 && String(row[headerMap.ID_MENSAL]) === String(payload.id));
  if (targetIdx === -1) {
    throw new Error('Conta não encontrada para o ID informado.');
  }

  const row = data[targetIdx];

  if (payload.nomeConta !== undefined) row[headerMap.NOME_CONTA] = payload.nomeConta;
  if (payload.categoria !== undefined) row[headerMap.CATEGORIA] = payload.categoria;
  if (payload.tipoPessoa !== undefined) row[headerMap.TIPO_PESSOA] = payload.tipoPessoa;
  if (payload.valorPrevisto !== undefined) row[headerMap.VALOR_PREVISTO] = payload.valorPrevisto;
  if (payload.valorReal !== undefined) row[headerMap.VALOR_REAL] = payload.valorReal;
  if (payload.vencimento !== undefined) row[headerMap.VENCIMENTO] = payload.vencimento ? new Date(payload.vencimento) : '';
  if (payload.dataPagamento !== undefined) row[headerMap.DATA_PAGAMENTO] = payload.dataPagamento ? new Date(payload.dataPagamento) : '';
  if (payload.metodoPagamento !== undefined) row[headerMap.METODO_PAGAMENTO] = payload.metodoPagamento;
  if (payload.origem !== undefined) row[headerMap.ORIGEM] = payload.origem;
  if (payload.observacoes !== undefined) row[headerMap.OBSERVACOES] = payload.observacoes;

  if (payload.pago !== undefined) {
    row[headerMap.PAGO] = toSimNao(payload.pago);
  } else if (payload.dataPagamento) {
    row[headerMap.PAGO] = 'SIM';
  }

  row[headerMap.ATRASADO] = calcularAtraso(row[headerMap.VENCIMENTO], row[headerMap.PAGO], row[headerMap.DATA_PAGAMENTO]);
  if (payload.notificacaoEnviada !== undefined) {
    row[headerMap.NOTIFICACAO_ENVIADA] = toSimNao(payload.notificacaoEnviada);
  } else if (!row[headerMap.NOTIFICACAO_ENVIADA]) {
    row[headerMap.NOTIFICACAO_ENVIADA] = 'NAO';
  }

  sheet.getRange(targetIdx + 1, 1, 1, sheet.getLastColumn()).setValues([row]);

  return mapRowToObject(row, headerMap);
}
