/* Каталог: состояние живёт в адресе, поэтому «Назад» и ссылка возвращают ту же выборку */
import { tile } from '../components.js';
import { countBooks, esc, isSheetLayout, reducedMotion, SHEET_QUERY } from '../format.js';
import { library, SORTS } from '../library.js';
import { nav } from '../nav.js';

const ICONS = {
  section: {
    '': 'M3.5 3.5h5v5h-5zM11.5 3.5h5v5h-5zM3.5 11.5h5v5h-5zM11.5 11.5h5v5h-5z',
    lit: 'M10 5.5C8 4 5.5 3.8 3 4.2v11c2.5-.4 5-.2 7 1.3 2-1.5 4.5-1.7 7-1.3v-11c-2.5-.4-5-.2-7 1.3zM10 5.5v11',
    tech: 'M3.5 4.5h13v9h-13zM7 16.5h6',
    hist: 'M5 3h10M5 17h10M6 3c0 4 8 6 8 14M14 3c0 4-8 6-8 14',
    law: 'M10 3v14M6 17h8M4 6h12M4 6l-2 5h4zM16 6l-2 5h4z',
    soc: 'M3.5 16.5h13M6 16v-5M10 16V5M14 16V8.5',
  },
  lang: {
    '': 'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM3 10h14M10 3c2 2 3 4.3 3 7s-1 5-3 7c-2-2-3-4.3-3-7s1-5 3-7z',
    ru: 'M4 4.5h12v9H9l-4 3v-3H4z',
    uz: 'M4 4.5h12v9H9l-4 3v-3H4z',
    en: 'M4 4.5h12v9H9l-4 3v-3H4z',
  },
};

function readFilters(params) {
  const pick = (value, allowed) => (Object.hasOwn(allowed, value) ? value : '');
  return {
    q: params.get('q') || '',
    section: pick(params.get('s'), library.sections),
    lang: pick(params.get('l'), library.languages),
    sort: pick(params.get('sort'), SORTS) || 'match',
  };
}

function filtersToHash({ q, section, lang, sort }) {
  const params = new URLSearchParams();
  if (q.trim()) params.set('q', q.trim());
  if (section) params.set('s', section);
  if (lang) params.set('l', lang);
  if (sort !== 'match') params.set('sort', sort);
  const query = params.toString();
  return `#/catalog${query ? `?${query}` : ''}`;
}

export function catalogScreen({ params }) {
  const filters = readFilters(params);
  const option = (name, value, label) => `<label class="pick">
    <input type="radio" name="${name}" value="${value}" ${filters[name] === value ? 'checked' : ''}>
    <svg viewBox="0 0 20 20" aria-hidden="true"><path d="${ICONS[name][value]}"/></svg>
    <span>${esc(label)}</span>
  </label>`;
  const sortOption = ([value, { label }]) => `<li role="option" id="sort-${value}" data-value="${value}" aria-selected="${filters.sort === value}">${label}</li>`;

  return {
    title: 'Каталог',
    bind: (signal) => bind(filters, signal),
    html: `
    <div class="wrap wrap-page">
      <h1>Каталог</h1>
      <div class="catalog">
        <div class="cat-bar">
          <form class="field" id="catSearch" role="search">
            <label class="sr" for="catQ">Книга или автор</label>
            <input id="catQ" type="search" value="${esc(filters.q)}" placeholder="Книга или автор" autocomplete="off">
          </form>
          <button type="button" class="btn btn-quiet filters-toggle" id="filtersToggle" aria-expanded="false" aria-controls="filters">Фильтры</button>
        </div>
        <aside class="filters-box" id="filtersBox" aria-label="Фильтры">
          <div class="filters-fold"><div class="filters" id="filters">
            <div class="sheet-head"><b>Фильтры</b><button type="button" class="text-btn" id="sheetReset">Сбросить</button></div>
            <div class="filter-groups">
              <fieldset><legend>Раздел</legend>
                ${option('section', '', 'Все разделы')}
                ${Object.entries(library.sections).map(([k, v]) => option('section', k, v)).join('')}
              </fieldset>
              <fieldset><legend>Язык</legend>
                ${option('lang', '', 'Все языки')}
                ${Object.entries(library.languages).map(([k, v]) => option('lang', k, v)).join('')}
              </fieldset>
            </div>
            <div class="sheet-foot"><button type="button" class="btn btn-main filters-done" id="filtersDone"></button></div>
          </div></div>
        </aside>
        <div class="cat-list" id="catListArea">
          <div class="list-head">
            <p id="catCount" role="status"></p>
            <button type="button" class="text-btn" id="catClear" hidden>Сбросить</button>
            <div class="sort" id="sort">
              <button type="button" class="sort-button" id="sortButton" aria-haspopup="listbox" aria-expanded="false" aria-controls="sortList">
                <span class="sort-prefix">Сначала</span> <b id="sortValue">${SORTS[filters.sort].label}</b>
                <svg viewBox="0 0 12 12" aria-hidden="true"><path d="m2.5 4.5 3.5 3.5 3.5-3.5"/></svg>
              </button>
              <ul class="sort-list" id="sortList" role="listbox" tabindex="-1" aria-label="Порядок книг">
                ${Object.entries(SORTS).map(sortOption).join('')}
              </ul>
            </div>
          </div>
          <div id="catList"></div>
        </div>
      </div>
    </div>`,
  };
}

/* Список сортировки с управлением мышью и клавиатурой */
function bindSort(filters, onChange, signal) {
  const root = document.getElementById('sort');
  const button = document.getElementById('sortButton');
  const list = document.getElementById('sortList');
  const options = [...list.querySelectorAll('[role="option"]')];
  let active = options.findIndex((o) => o.dataset.value === filters.sort);

  const setActive = (index) => {
    active = (index + options.length) % options.length;
    options.forEach((o, i) => o.classList.toggle('active', i === active));
    list.setAttribute('aria-activedescendant', options[active].id);
  };
  const setOpen = (open) => {
    root.classList.toggle('open', open);
    button.setAttribute('aria-expanded', open);
    if (open) {
      setActive(options.findIndex((o) => o.dataset.value === filters.sort));
      list.focus({ preventScroll: true });
    }
  };
  const choose = (option) => {
    filters.sort = option.dataset.value;
    options.forEach((o) => o.setAttribute('aria-selected', o === option));
    document.getElementById('sortValue').textContent = SORTS[filters.sort].label;
    setOpen(false);
    button.focus({ preventScroll: true });
    onChange();
  };

  button.addEventListener('click', () => setOpen(!root.classList.contains('open')));
  list.addEventListener('click', (e) => {
    const option = e.target.closest('[role="option"]');
    if (option) choose(option);
  });
  list.addEventListener('pointermove', (e) => {
    const index = options.indexOf(e.target.closest('[role="option"]'));
    if (index >= 0) setActive(index);
  });
  list.addEventListener('keydown', (e) => {
    const moves = { ArrowDown: active + 1, ArrowUp: active - 1, Home: 0, End: options.length - 1 };
    if (e.key in moves) {
      e.preventDefault();
      setActive(moves[e.key]);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(options[active]);
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setOpen(false);
      if (e.key === 'Escape') button.focus();
    }
  });
  document.addEventListener('pointerdown', (e) => {
    if (!root.contains(e.target)) setOpen(false);
  }, { signal });
}

function bind(filters, signal) {
  const list = document.getElementById('catList');
  const area = document.getElementById('catListArea');
  const count = document.getElementById('catCount');
  const clear = document.getElementById('catClear');
  const search = document.getElementById('catQ');
  const toggle = document.getElementById('filtersToggle');
  const box = document.getElementById('filtersBox');
  const done = document.getElementById('filtersDone');

  const syncAddress = () => {
    const address = filtersToHash(filters);
    history.replaceState(history.state, '', address);
    nav.catalog = address;
    nav.address = address;
    try {
      sessionStorage.setItem('catalog', address);
    } catch { /* приватный режим */ }
  };

  let shownKey = null;
  const keyOf = (found) => (found.length
    ? found.map((b) => b.id).join()
    : `?${filters.q.trim()}|${filters.section}|${filters.lang}`);

  function renderSummary(found) {
    const chosen = [library.sections[filters.section], library.languages[filters.lang]].filter(Boolean);
    const summary = `Нашлось ${countBooks(found.length)}`;
    count.textContent = chosen.length ? `${summary}: ${chosen.join(', ')}` : summary;
    count.classList.toggle('sr', !found.length);
    document.getElementById('sort').hidden = !found.length;
    clear.hidden = !chosen.length;
    toggle.textContent = chosen.length ? `Фильтры: ${chosen.length}` : 'Фильтры';
    done.textContent = `Показать ${countBooks(found.length).replace(/книга$/, 'книгу')}`;
    return chosen;
  }

  function render() {
    const found = library.list(filters);
    shownKey = keyOf(found);
    const chosen = renderSummary(found);
    list.innerHTML = found.length
      ? `<ul class="tiles tiles-fill">${found.map(tile).join('')}</ul>`
      : `<div class="empty"><p>${chosen.length
        ? 'Ничего не нашлось. Уберите часть фильтров или поищите автора по фамилии.'
        : `По запросу «${esc(filters.q.trim())}» ничего нет. Проверьте написание или поищите автора по фамилии.`}</p>
         <button type="button" class="btn btn-quiet" id="catReset">${chosen.length ? 'Сбросить фильтры' : 'Сбросить поиск'}</button></div>`;
    document.getElementById('catReset')?.addEventListener('click', () => reset({ query: !chosen.length }));
  }

  /* Вернуть начало списка, пока он прозрачен: иначе короткая выдача дёрнет страницу */
  const keepListInView = () => {
    const top = area.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
    if (scrollY > top) scrollTo(0, top);
  };

  /* При смене выборки плавно меняются только книги, всё вокруг стоит на месте */
  let fade = null;
  let updateId = 0;
  function update() {
    syncAddress();
    const found = library.list(filters);
    if (keyOf(found) === shownKey) {
      renderSummary(found);
      return;
    }
    if (reducedMotion()) {
      render();
      keepListInView();
      return;
    }
    updateId += 1;
    const id = updateId;
    const from = Number(getComputedStyle(list).opacity);
    fade?.cancel();
    const hide = list.animate({ opacity: [from, 0] }, { duration: 130 * from, easing: 'ease-out', fill: 'forwards' });
    fade = hide;
    hide.finished.then(() => {
      if (id !== updateId || signal.aborted) return;
      render();
      keepListInView();
      fade = list.animate({ opacity: [0, 1] }, { duration: 280, easing: 'ease-out' });
      hide.cancel();
    }).catch(() => {});
  }

  function reset({ query = false } = {}) {
    filters.section = '';
    filters.lang = '';
    if (query) {
      filters.q = '';
      search.value = '';
    }
    document.querySelectorAll('.filters input[value=""]').forEach((r) => { r.checked = true; });
    update();
    if (!box.classList.contains('open')) search.focus();
  }

  const outsideSheet = ['.skip', '.top', '.cat-bar', '.cat-list', '.foot', '.tabbar'];
  function setOpen(open) {
    box.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
    document.body.classList.toggle('sheet-open', open);
    outsideSheet.forEach((selector) => { document.querySelector(selector).inert = open; });
    if (open) {
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      document.querySelector('.filters input:checked').focus({ preventScroll: true });
    } else {
      box.removeAttribute('role');
      box.removeAttribute('aria-modal');
    }
  }

  const closeSheet = () => {
    setOpen(false);
    toggle.focus();
  };

  /* На телефоне Enter прячет клавиатуру, иначе она закрывает результаты */
  document.getElementById('catSearch').addEventListener('submit', (e) => {
    e.preventDefault();
    if (isSheetLayout()) search.blur();
  });
  let typing;
  search.addEventListener('input', () => {
    filters.q = search.value;
    clearTimeout(typing);
    typing = setTimeout(update, 140);
  });
  signal.addEventListener('abort', () => clearTimeout(typing));
  bindSort(filters, update, signal);
  document.getElementById('filters').addEventListener('change', (e) => {
    filters[e.target.name] = e.target.value;
    update();
  });
  clear.addEventListener('click', () => reset());
  document.getElementById('sheetReset').addEventListener('click', () => reset());
  toggle.addEventListener('click', () => setOpen(true));
  done.addEventListener('click', closeSheet);
  box.addEventListener('click', (e) => {
    if (e.target === box) closeSheet();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && box.classList.contains('open')) closeSheet();
  }, { signal });
  matchMedia(SHEET_QUERY).addEventListener('change', () => setOpen(false), { signal });
  signal.addEventListener('abort', () => setOpen(false));
  syncAddress();
  render();
}
