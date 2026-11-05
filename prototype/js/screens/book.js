import { cover, tile } from '../components.js';
import { esc, hyphenate, pagesText } from '../format.js';
import { library } from '../library.js';
import { nav } from '../nav.js';
import { store, updateShelfCount } from '../store.js';
import { missingScreen } from './missing.js';

const saveLabel = (id) => (store.shelf().includes(id) ? 'Убрать с полки' : 'На мою полку');

export function bookScreen({ id }) {
  const b = library.get(id);
  if (!b) return missingScreen();
  const near = library.related(b, 10);

  return {
    title: b.title,
    bind: () => bind(b),
    html: `
    <div class="wrap wrap-page">
      <a class="back" href="${esc(nav.back.href())}">${nav.back.label}</a>
      <div class="book">
        <div class="book-cover">${cover(b, { named: true })}</div>
        <article class="book-card">
          <div class="book-main">
            <p class="book-author">${esc(b.author)}</p>
            <h1 lang="${esc(b.lang)}">${hyphenate(esc(b.title))}</h1>
            <p class="book-meta">${[b.year && `${b.year} год`, pagesText(b), library.languages[b.lang].toLowerCase()].filter(Boolean).join(', ')}</p>
            <p class="book-about">${esc(b.about)}</p>
          </div>
          <div class="book-side">
            <p class="book-how">Полного текста пока нет. ${b.scans > 1 ? `Из скана доступно страниц: ${b.scans}.` : 'Из скана доступна одна страница.'}</p>
            <div class="book-actions">
              <a class="btn btn-main" href="#/read/${encodeURIComponent(b.id)}">${b.scans > 1 ? 'Смотреть страницы' : 'Смотреть страницу'}</a>
              <button type="button" class="btn btn-quiet" id="saveBook">${saveLabel(b.id)}</button>
            </div>
          </div>
          <dl class="book-facts">
            ${b.year ? `<div><dt>Год</dt><dd>${b.year}</dd></div>` : ''}
            <div><dt>Объём</dt><dd>${pagesText(b)}</dd></div>
            <div><dt>Раздел</dt><dd>${esc(library.sections[b.section])}</dd></div>
            <div><dt>Язык</dt><dd>${esc(library.languages[b.lang])}</dd></div>
          </dl>
        </article>
      </div>
      <section class="block">
        <h2>Похожие издания</h2>
        <ul class="tiles tiles-row">${near.map(tile).join('')}</ul>
      </section>
    </div>`,
  };
}

function bind(b) {
  const save = document.getElementById('saveBook');
  save.addEventListener('click', () => {
    store.toggleShelf(b.id);
    updateShelfCount();
    save.textContent = saveLabel(b.id);
  });
}
