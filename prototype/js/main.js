/* Запуск сайта и события на всю страницу */
import { withTransition } from './format.js';
import { nav } from './nav.js';
import { focusHeading, nameTransition, parseAddress, route } from './router.js';
import { store, updateShelfCount } from './store.js';

const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const isNight = () => root.classList.contains('night');

themeToggle.setAttribute('aria-pressed', isNight());
themeToggle.addEventListener('click', () => {
  const night = !isNight();
  store.setTheme(night ? 'night' : 'day');
  withTransition(() => {
    root.classList.toggle('night', night);
    themeToggle.setAttribute('aria-pressed', night);
  });
});

let scrollTimer;
history.scrollRestoration = 'manual';
window.addEventListener('popstate', () => { nav.restoreScroll = !nav.linkClick; });
window.addEventListener('hashchange', () => withTransition(() => route()));
window.addEventListener('scroll', () => {
  nav.positions.set(nav.address, scrollY);
  /* Пока идёт прокрутка, браузер не обновляет наведение, и книга осталась бы повёрнутой */
  root.classList.add('scrolling');
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => root.classList.remove('scrolling'), 160);
}, { passive: true });

window.addEventListener('storage', (e) => {
  if (e.key === 'theme') {
    root.classList.toggle('night', e.newValue === '"night"');
    themeToggle.setAttribute('aria-pressed', isNight());
    return;
  }
  if (e.key !== 'shelf' && e.key !== null) return;
  updateShelfCount();
  const { page } = parseAddress();
  if (page === 'book' || page === 'shelf') {
    nav.restoreScroll = true;
    route({ initial: true });
  }
});

document.addEventListener('click', (e) => {
  if (e.defaultPrevented || e.button || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
  const link = e.target.closest?.('a[href^="#"]');
  if (!link) return;
  if (!link.matches('.back') && link.getAttribute('href') !== location.hash) nav.linkClick = true;
  if (link.dataset.book) nameTransition(link.dataset.book);
});

document.querySelector('.skip').addEventListener('click', (e) => {
  e.preventDefault();
  focusHeading();
});

document.addEventListener('keydown', (e) => {
  if (e.code !== 'Slash' || e.ctrlKey || e.metaKey || e.altKey || document.activeElement.tagName === 'INPUT') return;
  const field = document.querySelector('#view input[type="search"]');
  if (!field) return;
  e.preventDefault();
  field.focus();
});

/* Заставка держится недолго и всегда уходит, даже если что-то пошло не так при запуске */
function hideSplash() {
  const splash = document.getElementById('splash');
  if (root.classList.contains('no-splash')) {
    splash.remove();
    return;
  }
  store.markSplashShown();
  setTimeout(() => {
    splash.classList.add('done');
    splash.addEventListener('transitionend', () => splash.remove(), { once: true });
  }, 700);
}

updateShelfCount();
root.classList.add('first');
setTimeout(() => root.classList.remove('first'), 1800);
try {
  route({ initial: true });
} finally {
  hideSplash();
}
