// Core application state and routing for the StarPay WebApp.

// Global state controlling filters, datasets and current navigation context.
const state = {
  currentSection: 'contas-mes',
  filtros: {
    categoria: 'todas',
    tipoPessoa: 'todas',
    statusPagamento: 'todas',
  },
  datasets: {
    contasFixas: [],
    contasPontuais: [],
    contasMes: [],
  },
};

const SELECTORS = {
  section: '[data-section]',
  sectionTrigger: '[data-section-target]',
  navLink: '.nav-link',
  pageSection: '.page-section',
  toastContainer: '#toast-container',
  contasMes: '[data-contas-mes]',
};

// --- GAS client helpers ---
/**
 * Generic wrapper around google.script.run that centralizes loading and error handling.
 * @param {string} fn - Apps Script function name.
 * @param {*} payload - Payload forwarded to the server.
 * @param {Function} [onSuccess] - Callback executed on success.
 * @param {Function} [onError] - Callback executed on failure.
 */
function callServer(fn, payload = {}, onSuccess, onError) {
  const runner = (typeof google !== 'undefined' && google.script && google.script.run) || null;
  if (!runner || typeof runner[fn] !== 'function') {
    const message = `Função de servidor indisponível: ${fn}`;
    console.error(message);
    if (typeof onError === 'function') onError(message);
    else showError(message);
    return;
  }

  setLoading(true);
  clearError();

  runner
    .withSuccessHandler((response) => {
      setLoading(false);
      if (typeof onSuccess === 'function') onSuccess(response);
    })
    .withFailureHandler((error) => {
      console.error('Erro ao chamar servidor:', error);
      setLoading(false);
      if (typeof onError === 'function') onError(error);
      else showError(error);
    })[fn](payload);
}

const gasClient = {
  callServer,
  listarContasFixas: (payload, onSuccess, onError) =>
    callServer('listarContasFixas', payload, onSuccess, onError),
  criarContaFixa: (payload, onSuccess, onError) =>
    callServer('criarContaFixa', payload, onSuccess, onError),
  criarContaPontual: (payload, onSuccess, onError) =>
    callServer('criarContaPontual', payload, onSuccess, onError),
  listarContasMes: (payload, onSuccess, onError) =>
    callServer('listarContasMes', payload, onSuccess, onError),
  marcarPago: (payload, onSuccess, onError) => callServer('marcarPago', payload, onSuccess, onError),
  gerarMes: (payload, onSuccess, onError) => callServer('gerarMes', payload, onSuccess, onError),
  processarLembretes: (payload, onSuccess, onError) =>
    callServer('processarLembretes', payload, onSuccess, onError),
};

// --- UI helpers ---
function setLoading(isLoading) {
  const loader = document.querySelector('[data-loader]');
  if (!loader) return;
  loader.style.display = isLoading ? 'flex' : 'none';
}

function showError(error) {
  const message = typeof error === 'string' ? error : error?.message || 'Erro inesperado';
  const alertBox = document.querySelector('[data-alert]');
  if (alertBox) {
    alertBox.textContent = message;
    alertBox.classList.add('is-visible');
  } else {
    alert(message);
  }
}

function clearError() {
  const alertBox = document.querySelector('[data-alert]');
  if (alertBox) alertBox.classList.remove('is-visible');
}

// Toast helpers (optional, used by nav links)
function createToast(message, variant = 'info', duration = 3000) {
  const toastContainer = document.querySelector(SELECTORS.toastContainer);
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast ${variant}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(6px)';
    setTimeout(() => toast.remove(), 200);
  }, duration);
}

// --- Routing ---
function setupRouting() {
  window.addEventListener('hashchange', handleRouteChange);
  document.querySelectorAll(SELECTORS.sectionTrigger).forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.getAttribute('data-section-target');
      if (target) window.location.hash = `#${target}`;
    });
  });

  document.querySelectorAll(SELECTORS.navLink).forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.dataset.section;
      if (targetId) {
        event.preventDefault();
        window.location.hash = `#${targetId}`;
        createToast(`Você está em: ${link.textContent}`, 'info', 1500);
      }
    });
  });

  // Fallback: ensure the first section is visible if none are marked active
  handleRouteChange();
  ensureInitialSection();
}

function handleRouteChange() {
  const section = window.location.hash.replace('#', '') || state.currentSection;
  state.currentSection = section;
  updateActiveSection(section);
}

function ensureInitialSection() {
  const sections = Array.from(document.querySelectorAll(SELECTORS.pageSection));
  if (!sections.some((section) => section.classList.contains('active') || section.classList.contains('is-active'))) {
    const firstSection = sections[0];
    if (firstSection) updateActiveSection(firstSection.id || firstSection.dataset.section || 'dashboard');
  }
}

function updateActiveSection(sectionId) {
  document.querySelectorAll(SELECTORS.section).forEach((element) => {
    const isActive = element.getAttribute('data-section') === sectionId;
    element.classList.toggle('is-active', isActive);
    element.classList.toggle('active', isActive);
  });

  document.querySelectorAll(SELECTORS.pageSection).forEach((element) => {
    const isActive = element.id === sectionId;
    element.classList.toggle('active', isActive);
  });

  document.querySelectorAll(SELECTORS.sectionTrigger).forEach((button) => {
    const isActive = button.getAttribute('data-section-target') === sectionId;
    button.classList.toggle('is-active', isActive);
  });

  document.querySelectorAll(SELECTORS.navLink).forEach((link) => {
    const isActive = link.dataset.section === sectionId;
    link.classList.toggle('active', isActive);
    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

// --- Data loading ---
function carregarContasMes() {
  clearError();
  const filtros = { ...state.filtros };
  gasClient.listarContasMes(
    filtros,
    (data) => {
      state.datasets.contasMes = Array.isArray(data) ? data : [];
      renderContasMes();
    },
    showError
  );
}

function renderContasMes() {
  const container = document.querySelector(SELECTORS.contasMes);
  if (!container) return;
  container.innerHTML = '';

  if (!state.datasets.contasMes.length) {
    container.innerHTML = '<p class="muted">Nenhuma conta encontrada para os filtros aplicados.</p>';
    return;
  }

  const list = document.createElement('ul');
  list.className = 'contas-lista';

  state.datasets.contasMes.forEach((conta) => {
    const item = document.createElement('li');
    item.className = 'conta-linha';
    item.innerHTML = `
      <div class="conta-col nome">${conta.nomeConta || conta.nome || 'Conta'}</div>
      <div class="conta-col vencimento">${conta.vencimento || '--'}</div>
      <div class="conta-col valor">${conta.valorPrevisto || conta.valor || 0}</div>
      <div class="conta-col status">${conta.pago ? 'Pago' : 'Em aberto'}</div>
    `;
    list.appendChild(item);
  });

  container.appendChild(list);
}

// --- Initialization ---
function initApp() {
  setupRouting();
  carregarContasMes();
}

document.addEventListener('DOMContentLoaded', initApp);

// Expose helpers for other modules or inline scripts.
window.gasClient = gasClient;
window.state = state;
window.callServer = callServer;
// Entry point for the StarPay WebApp UI.
// Use ES module exports for shared utilities as the WebApp grows.

const state = {
  initialized: false,
};

function renderWelcome() {
  const container = document.getElementById('main-content');
  if (!container) return;

  container.innerHTML = `
    <h2>Welcome</h2>
    <p class="section-description">
      Use this shell to connect the WebApp to your Google Apps Script backend and Sheets data.
      Replace this card with navigation, forms, and dashboards tailored to the StarPay spec.
    </p>
    <button class="button-primary" id="load-data">Load sample data</button>
  `;

  const button = document.getElementById('load-data');
  button?.addEventListener('click', handleLoadSampleData);
}

function handleLoadSampleData() {
  // Placeholder for future google.script.run calls.
  console.info('Sample action triggered. Wire this up to Apps Script methods.');
}

function init() {
  if (state.initialized) return;
  renderWelcome();
  state.initialized = true;
}

// Initialize immediately for static hosting; Apps Script can also call init() after load.
init();

export { init };
