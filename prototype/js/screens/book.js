import { cover, tile } from '../components.js';
import { countPages, esc } from '../format.js';
import { library } from '../library.js';
import { nav } from '../nav.js';
import { store, updateShelfCount } from '../store.js';
import { missingScreen } from './missing.js';

const HOW_TO_GET = {
  online: 'Есть текст онлайн.',
  hall: 'Бумажная книга в читальном зале. Назовите шифр библиотекарю.',
  paper: 'Цифровой копии пока нет. Бумажную книгу выдают по шифру.',
};

const saveLabel = (id) => (store.shelf().includes(id) ? 'Убрать с полки' : 'На мою полку');

export function bookScreen({ id }) {
  const b = library.get(id);
  if (!b) return missingScreen();
  const near = library.related(b, 10);
  const code = b.access === 'online' ? '' : `<div class="book-code">
      <p><span>Шифр</span> <b>${esc(b.code)}</b></p>
      <button type="button" class="text-btn" id="copyCode">Скопировать</button>
      <small>Номер книги в фонде, по нему её находят.</small>
    </div>`;

  return {
    title: b.title,
    bind: (signal) => bind(b, signal),
    html: `
    <div class="wrap wrap-page">
      <a class="back" href="${esc(nav.back.href())}">${nav.back.label}</a>
      <div class="book">
        <div class="book-cover">${cover(b, { named: true })}</div>
        <article class="book-card">
          <p class="book-author">${esc(b.author)}</p>
          <h1>${esc(b.title)}</h1>
          <p class="book-meta">${b.year} год, ${countPages(b.pages)}</p>
          <p class="book-about">${esc(b.about)}</p>
          <div class="book-side">
            <p class="book-how">${HOW_TO_GET[b.access]}</p>
            ${code}
            <div class="book-actions">
              <a class="btn btn-main" href="#/read/${b.id}">Читать</a>
              <button type="button" class="btn btn-quiet" id="saveBook">${saveLabel(b.id)}</button>
            </div>
          </div>
        </article>
      </div>
      <section class="block">
        <h2>Что ещё почитать</h2>
        <ul class="tiles tiles-row">${near.map(tile).join('')}</ul>
      </section>
    </div>`,
  };
}

function bind(b, signal) {
  const save = document.getElementById('saveBook');
  save.addEventListener('click', () => {
    store.toggleShelf(b.id);
    updateShelfCount();
    save.textContent = saveLabel(b.id);
  });
  const copy = document.getElementById('copyCode');
  let timer;
  signal.addEventListener('abort', () => clearTimeout(timer));
  copy?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(b.code);
      copy.textContent = 'Скопировано';
    } catch {
      copy.textContent = 'Не вышло';
    }
    clearTimeout(timer);
    timer = setTimeout(() => { copy.textContent = 'Скопировать'; }, 1800);
  });
}
