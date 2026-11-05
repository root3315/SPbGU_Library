/* Страницы издания из сканов, по одной. Номер страницы живёт в адресе */
import { esc, reducedMotion } from '../format.js';
import { library } from '../library.js';
import { nav } from '../nav.js';
import { missingScreen } from './missing.js';

const pageUrl = (b, page) => `scans/${encodeURIComponent(b.id)}/${page}.jpg`;
const ARROW = { prev: 'M12.5 4.5 7 10l5.5 5.5', next: 'M7.5 4.5 13 10l-5.5 5.5' };
const arrow = (name) => `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="${ARROW[name]}"/></svg>`;
const FRAGMENT_NOTE = 'Это страницы из скана, не вся книга.';
const LAST_NOTE = 'Страницы из скана закончились. Полный текст появится после оцифровки.';

export function readerScreen({ id, params, signal }) {
  const b = library.get(id);
  if (!b) return missingScreen();
  const wanted = Number.parseInt(params.get('p'), 10);
  const page = Math.min(b.scans, Math.max(1, wanted || 1));
  const turn = (name, label) => (b.scans > 1
    ? `<button type="button" class="reader-turn" id="${name}" aria-label="${label}">${arrow(name === 'pagePrev' ? 'prev' : 'next')}</button>` : '');
  return {
    title: b.title,
    bind: () => bind(b, page, signal),
    html: `
    <div class="reader">
      <div class="reader-bar">
        <a class="back" href="#/book/${encodeURIComponent(b.id)}">Назад</a>
        <h1 class="reader-name" lang="${esc(b.lang)}">${esc(b.title)}</h1>
      </div>
      <article class="reader-page">
        <p class="reader-note" id="pageNote"></p>
        <figure class="reader-sheet" id="sheet">
          <img class="reader-scan" id="scan" src="${pageUrl(b, page)}" width="1200" height="1700" alt="">
        </figure>
        <div class="reader-failed" id="scanFailed" hidden>
          <p>Страница не загрузилась.</p>
          <button type="button" class="btn btn-quiet" id="scanRetry">Повторить</button>
        </div>
        <div class="reader-pager">
          ${turn('pagePrev', 'Предыдущая страница')}
          <p class="reader-count" id="pageCount" role="status"></p>
          ${turn('pageNext', 'Следующая страница')}
          <button type="button" class="btn btn-quiet reader-zoom" id="pageZoom" aria-pressed="false">Крупнее</button>
        </div>
      </article>
    </div>`,
  };
}

function bind(b, first, signal) {
  const sheet = document.getElementById('sheet');
  const scan = document.getElementById('scan');
  const prev = document.getElementById('pagePrev');
  const next = document.getElementById('pageNext');
  const count = document.getElementById('pageCount');
  const note = document.getElementById('pageNote');
  const zoom = document.getElementById('pageZoom');
  const failed = document.getElementById('scanFailed');
  let page = first;
  let request = 0;

  const preload = (n) => {
    if (n >= 1 && n <= b.scans) new Image().src = pageUrl(b, n);
  };
  const browserZoomed = () => (visualViewport?.scale || 1) > 1.05;

  function paint() {
    scan.alt = `Страница ${page} из ${b.scans}`;
    count.textContent = `${page} из ${b.scans}`;
    note.textContent = page === b.scans ? LAST_NOTE : FRAGMENT_NOTE;
    prev?.setAttribute('aria-disabled', page === 1);
    next?.setAttribute('aria-disabled', page === b.scans);
    preload(page + 1);
    preload(page - 1);
  }

  function saveAddress() {
    const address = `#/read/${encodeURIComponent(b.id)}${page > 1 ? `?p=${page}` : ''}`;
    history.replaceState(history.state, '', address);
    nav.address = address;
  }

  function setFailed(on) {
    failed.hidden = !on;
    sheet.hidden = on;
  }

  /* Новая страница подменяет старую только после загрузки, быстрое листание не собирает очередь */
  function load() {
    request += 1;
    const id = request;
    const url = pageUrl(b, page);
    const slow = setTimeout(() => sheet.classList.add('busy'), 300);
    const next = new Image();
    const done = () => {
      clearTimeout(slow);
      sheet.classList.remove('busy');
    };
    next.onload = () => {
      if (id !== request || signal.aborted) return;
      done();
      setFailed(false);
      scan.src = url;
      if (!reducedMotion()) scan.animate({ opacity: [0.4, 1] }, { duration: 200, easing: 'ease-out' });
    };
    next.onerror = () => {
      if (id !== request || signal.aborted) return;
      done();
      setFailed(true);
    };
    next.src = url;
  }

  function go(target) {
    if (target < 1 || target > b.scans || target === page) return;
    page = target;
    paint();
    saveAddress();
    window.scrollTo(0, 0);
    sheet.scrollLeft = 0;
    load();
  }

  /* Страница растёт от точки нажатия, поэтому нужная строка остаётся на экране */
  function setLarge(on, pointY = null) {
    if (sheet.classList.contains('large') === on) return;
    const before = scan.getBoundingClientRect();
    sheet.classList.toggle('large', on);
    zoom.textContent = on ? 'Целиком' : 'Крупнее';
    zoom.setAttribute('aria-pressed', on);
    if (on && pointY !== null) {
      const after = scan.getBoundingClientRect();
      window.scrollBy(0, (pointY - before.top) * (after.height / before.height - 1));
    } else if (!on) {
      window.scrollTo(0, 0);
    }
  }

  prev?.addEventListener('click', () => go(page - 1));
  next?.addEventListener('click', () => go(page + 1));
  zoom.addEventListener('click', () => setLarge(!sheet.classList.contains('large')));
  document.getElementById('scanRetry').addEventListener('click', load);
  scan.addEventListener('error', () => setFailed(true));
  scan.addEventListener('click', (e) => {
    if (!swiped) setLarge(!sheet.classList.contains('large'), e.clientY);
  });
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'ArrowRight') go(page + 1);
    if (e.key === 'ArrowLeft') go(page - 1);
    if (e.key === '+' || e.key === '=') setLarge(true);
    if (e.key === '-' || e.key === 'Escape') setLarge(false);
  }, { signal });

  /* При масштабе двумя пальцами страницу двигают во все стороны, свайп выключается */
  visualViewport?.addEventListener('resize', () => sheet.classList.toggle('pinched', browserZoomed()), { signal });

  /* Свайп листает, вертикальная прокрутка и масштаб двумя пальцами остаются браузеру */
  let startX = null;
  let startY = 0;
  let swiped = false;
  scan.addEventListener('pointerdown', (e) => {
    swiped = false;
    startX = e.pointerType === 'touch' && e.isPrimary ? e.clientX : null;
    startY = e.clientY;
  });
  scan.addEventListener('pointercancel', () => { startX = null; });
  scan.addEventListener('pointerup', (e) => {
    if (startX === null || browserZoomed() || sheet.classList.contains('large')) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    startX = null;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    swiped = true;
    go(page + (dx < 0 ? 1 : -1));
  });

  paint();
}
