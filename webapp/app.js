const navLinks = Array.from(document.querySelectorAll('.nav-link'));
const sections = Array.from(document.querySelectorAll('.page-section'));
const toastContainer = document.getElementById('toast-container');

function setActiveSection(sectionId) {
  navLinks.forEach((link) => {
    const isActive = link.dataset.section === sectionId;
    link.classList.toggle('active', isActive);
    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  sections.forEach((section) => {
    section.classList.toggle('active', section.id === sectionId);
  });
}

function createToast(message, variant = 'info', duration = 3000) {
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

navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    const targetId = link.dataset.section;
    setActiveSection(targetId);
    createToast(`Você está em: ${link.textContent}`, 'info', 1500);
  });
});

// Fallback: ensure the first section is visible if none are marked active
if (!sections.some((section) => section.classList.contains('active'))) {
  setActiveSection(sections[0]?.id || 'dashboard');
}
