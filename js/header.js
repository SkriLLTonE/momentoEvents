function initHeader() {
  const header = document.getElementById('header');
  const nav = document.getElementById('nav');
  const menuBtn = document.querySelector('.menu');

  if (!header || !nav) return;

  function syncMenuState() {
    const isOpen = nav.classList.contains('open');
    header.classList.toggle('menu-open', isOpen);
    if (menuBtn) {
      menuBtn.setAttribute('aria-expanded', String(isOpen));
      menuBtn.textContent = isOpen ? '✕' : '☰';
    }
  }

  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 50);
  });

  menuBtn?.addEventListener('click', () => {
    nav.classList.toggle('open');
    syncMenuState();
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      syncMenuState();
    });
  });

  document.addEventListener('click', (event) => {
    if (!header.contains(event.target) && nav.classList.contains('open')) {
      nav.classList.remove('open');
      syncMenuState();
    }
  });

  syncMenuState();
}
