/* Просмотр издания как книги. Номер страницы живёт в адресе */
import { createFlipbook } from '../flipbook.js';
import { esc } from '../format.js';
import { library } from '../library.js';
import { nav } from '../nav.js';
import { missingScreen } from './missing.js';

const pageUrl = (b, page) => `scans/${encodeURIComponent(b.id)}/${page}.${b.full ? 'webp' : 'jpg'}`;
const ARROW = { prev: 'M12.5 4.5 7 10l5.5 5.5', next: 'M7.5 4.5 13 10l-5.5 5.5' };
const arrow = (name) => `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="${ARROW[name]}"/></svg>`;
const FRAGMENT_NOTE = 'Это страницы из скана, не вся книга.';
const ONE_NOTE = 'В скане одна страница, полного текста пока нет.';
const LAST_NOTE = 'Страницы из скана закончились. Полный текст появится после оцифровки.';

export function readerScreen({ id, params, signal }) {
  const b = library.get(id);
  if (!b) return missingScreen();
  const wanted = Number.parseInt(params.get('p'), 10);
  const page = Math.min(b.scans, Math.max(1, wanted || 1));
  const digits = String(b.scans).length;
  const controls = b.scans > 1 ? `<form class="reader-controls" id="pageJump" novalidate>
      <button type="button" class="reader-turn" id="pagePrev" aria-label="Предыдущая страница">${arrow('prev')}</button>
      <label class="reader-go" id="pageGo">
        <span class="reader-word" id="pageWord">Страница</span>
        <input id="pageInput" type="text" inputmode="numeric" pattern="[0-9]*" enterkeyhint="go" autocomplete="off" maxlength="4" style="--digits:${digits}" aria-label="Номер страницы, всего ${b.scans}">
        <span id="pageTotal">из ${b.scans}</span>
      </label>
      <button type="button" class="reader-turn" id="pageNext" aria-label="Следующая страница">${arrow('next')}</button>
      <button type="submit" class="btn btn-main reader-submit">Перейти</button>
      <p class="sr" id="pageStatus" role="status"></p>
    </form>` : '';
  return {
    title: b.title,
    bind: () => bind(b, page, signal),
    html: `
    <div class="reader">
      <div class="reader-bar">
        <a class="back" href="#/book/${encodeURIComponent(b.id)}">Назад</a>
        <h1 class="reader-name" lang="${esc(b.lang)}">${esc(b.title)}</h1>
        <button type="button" class="text-btn reader-zoom" id="pageZoom" aria-pressed="false">Крупнее</button>
      </div>
      <article class="reader-page">
        <p class="reader-note" id="pageNote"></p>
        <div class="reader-sheet" id="sheet"><div class="flipbook" id="flipbook"></div></div>
        <div class="reader-failed" id="scanFailed" hidden>
          <p>Страница не загрузилась.</p>
          <button type="button" class="btn btn-quiet" id="scanRetry">Повторить</button>
        </div>
        ${controls}
      </article>
    </div>`,
  };
}

function bind(b, first, signal) {
  const sheet = document.getElementById('sheet');
  const prev = document.getElementById('pagePrev');
  const next = document.getElementById('pageNext');
  const note = document.getElementById('pageNote');
  const zoom = document.getElementById('pageZoom');
  const failed = document.getElementById('scanFailed');
  const form = document.getElementById('pageJump');
  const input = document.getElementById('pageInput');
  const goLabel = document.getElementById('pageGo');
  const status = document.getElementById('pageStatus');
  const word = document.getElementById('pageWord');
  const totalLabel = document.getElementById('pageTotal');
  let page = first;
  let retry = null;
  let book = null;

  const browserZoomed = () => (visualViewport?.scale || 1) > 1.05;
  const editing = () => document.activeElement === input;

  let shownText = String(first);
  function paint(pages) {
    const shown = [pages.left, pages.right].filter(Boolean);
    if (b.full) note.textContent = b.source;
    else note.textContent = b.scans === 1 ? ONE_NOTE : shown.includes(b.scans) ? LAST_NOTE : FRAGMENT_NOTE;
    if (!form) return;
    shownText = shown.join('–');
    word.textContent = shown.length > 1 ? 'Страницы' : 'Страница';
    if (!editing()) input.value = shownText;
    input.placeholder = shownText;
    const digits = String(b.scans).length;
    input.style.setProperty('--digits', book.isSpread() ? digits * 2 + 1 : digits);
    status.textContent = `${shown.length > 1 ? `Страницы ${shown.join(' и ')}` : `Страница ${shown[0]}`} из ${b.scans}`;
    prev.setAttribute('aria-disabled', book.atStart());
    next.setAttribute('aria-disabled', book.atEnd());
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

  book = createFlipbook({
    root: document.getElementById('flipbook'),
    total: b.scans,
    thickness: b.pages || 300,
    start: first,
    coverColor: b.color || '#4a4038',
    url: (n) => pageUrl(b, n),
    label: (n) => `Страница ${n} из ${b.scans}`,
    signal,
    onPreview: (pages) => paint(pages),
    onChange(firstShown, pages) {
      const moved = firstShown !== page;
      page = firstShown;
      setFailed(false);
      paint(pages);
      if (moved) saveAddress();
    },
    onError(again) {
      retry = again;
      setFailed(true);
    },
  });

  function setLarge(on) {
    if (sheet.classList.contains('large') === on) return;
    sheet.classList.toggle('large', on);
    book.setLarge(on);
    zoom.textContent = on ? 'Целиком' : 'Крупнее';
    zoom.setAttribute('aria-pressed', on);
    if (!on) window.scrollTo(0, 0);
  }

  const setWrong = (on) => {
    goLabel.classList.toggle('wrong', on);
    input.setAttribute('aria-invalid', on);
    totalLabel.textContent = on ? `такой нет, всего ${b.scans}` : `из ${b.scans}`;
  };
  const finishJump = () => {
    input.value = '';
    input.blur();
  };

  /* Поле начинается пустым: текущий номер виден подсказкой, ввод не надо стирать */
  input?.addEventListener('focus', () => {
    input.value = '';
    form.classList.add('jumping');
  });
  input?.addEventListener('blur', () => {
    input.value = shownText;
    setWrong(false);
    form.classList.remove('jumping');
  });
  input?.addEventListener('input', () => {
    input.value = input.value.replace(/\D/g, '');
    setWrong(false);
  });
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      finishJump();
    }
  });
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!input.value) {
      finishJump();
      return;
    }
    const target = Number(input.value);
    if (target < 1 || target > b.scans) {
      setWrong(true);
      status.textContent = `Такой страницы нет, всего страниц: ${b.scans}`;
      input.select();
      return;
    }
    finishJump();
    book.go(target);
  });
  /* Иначе кнопка «Перейти» спрячется вместе с потерей фокуса раньше, чем сработает нажатие */
  form?.querySelector('.reader-submit').addEventListener('pointerdown', (e) => e.preventDefault());

  prev?.addEventListener('click', () => book.previous());
  next?.addEventListener('click', () => book.next());
  zoom.addEventListener('click', () => setLarge(!sheet.classList.contains('large')));
  /* Пришли со страницы книги: «Назад» возвращает по истории, иначе браузерная кнопка откроет просмотр снова */
  document.querySelector('.reader-bar .back').addEventListener('click', (e) => {
    if (!nav.cameFromBook) return;
    e.preventDefault();
    history.back();
  });
  document.getElementById('scanRetry').addEventListener('click', () => {
    setFailed(false);
    retry?.();
  });
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.target === input) return;
    if (e.key === 'ArrowRight') book.next();
    if (e.key === 'ArrowLeft') book.previous();
    if (e.key === '+' || e.key === '=') setLarge(true);
    if (e.key === '-' || e.key === 'Escape') setLarge(false);
    /* Цифра с клавиатуры сразу начинает ввод номера: 20 и Enter работают откуда угодно */
    if (input && /^\d$/.test(e.key)) input.focus();
  }, { signal });

  /* Панель с полем поднимается над экранной клавиатурой */
  const liftControls = () => {
    if (!form || browserZoomed()) return;
    const covered = innerHeight - visualViewport.height - visualViewport.offsetTop;
    form.style.setProperty('--keyboard', `${covered > 80 ? Math.round(covered) : 0}px`);
  };
  const onViewport = () => {
    sheet.classList.toggle('pinched', browserZoomed());
    liftControls();
  };
  visualViewport?.addEventListener('resize', onViewport, { signal });
  visualViewport?.addEventListener('scroll', liftControls, { signal });

  const opened = book.pages();
  page = opened.left || opened.right;
  paint(opened);
}
