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
