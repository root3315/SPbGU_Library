/* Адрес, смена экранов, прокрутка и фокус */
import { library } from './library.js';
import { addressKey, nav } from './nav.js';
import { bookScreen } from './screens/book.js';
import { catalogScreen } from './screens/catalog.js';
import { homeScreen } from './screens/home.js';
import { readerScreen } from './screens/reader.js';
import { missingScreen } from './screens/missing.js';
import { shelfScreen } from './screens/shelf.js';

const view = document.getElementById('view');

/* Чтобы добавить экран: файл в screens и строка здесь */
const ROUTES = {
  '': homeScreen,
  catalog: catalogScreen,
  book: bookScreen,
  read: readerScreen,
  shelf: shelfScreen,
};
const ACTIVE_NAV = { '': 'home', book: 'catalog', read: 'catalog' };
const BACK_LINKS = {
  catalog: { label: 'Каталог', href: () => nav.catalog },
  shelf: { label: 'Моя полка', href: () => '#/shelf' },
  '': { label: 'На главную', href: () => '#/' },
};

export function parseAddress() {
  const raw = location.hash.slice(1) || '/';
  const mark = raw.indexOf('?');
  const path = mark < 0 ? raw : raw.slice(0, mark);
  const [page = '', id] = path.split('/').filter(Boolean);
  return { page, id, params: new URLSearchParams(mark < 0 ? '' : raw.slice(mark + 1)) };
}

export function focusHeading() {
  const heading = view.querySelector('h1');
  if (!heading) return;
  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
}

/* Перелетает только одна обложка: иначе на большом каталоге браузер снимает каждую плитку */
export function nameTransition(id) {
  const box = view.querySelector(`.tile[data-book="${id}"] .volume-box`);
  if (box) box.style.viewTransitionName = `cover-${id}`;
}

function show(page, ctx) {
  const build = Object.hasOwn(ROUTES, page) ? ROUTES[page] : missingScreen;
  const screen = build(ctx);
  view.innerHTML = screen.html;
  screen.bind?.(ctx.signal);
  return screen;
}

export function route({ initial = false } = {}) {
  const { page, id, params } = parseAddress();
  nav.controller?.abort();
  nav.controller = new AbortController();
  nav.address = addressKey();
  if (Object.hasOwn(BACK_LINKS, page)) nav.back = BACK_LINKS[page];

  let screen;
  try {
    screen = show(page, { id, params, signal: nav.controller.signal });
  } catch (error) {
    console.error(error);
    screen = missingScreen();
    view.innerHTML = screen.html;
  }

  if (nav.lastBook && page !== 'book') nameTransition(nav.lastBook);
  nav.lastBook = page === 'book' && library.has(id) ? id : null;
  document.title = `${screen.title ? `${screen.title} — ` : ''}Электронная библиотека СПбГУ`;
  const active = Object.hasOwn(ACTIVE_NAV, page) ? ACTIVE_NAV[page] : page;
  document.querySelectorAll('[data-nav]').forEach((a) => {
    if (a.dataset.nav === active) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });

  window.scrollTo(0, nav.restoreScroll ? nav.positions.get(addressKey()) || 0 : 0);
  nav.restoreScroll = false;
  nav.linkClick = false;
  if (!initial) focusHeading();
}
