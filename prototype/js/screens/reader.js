import { cover } from '../components.js';
import { esc } from '../format.js';
import { library } from '../library.js';
import { clampFontSize, FONT_SIZE, store } from '../store.js';
import { missingScreen } from './missing.js';

export function readerScreen({ id }) {
  const b = library.get(id);
  if (!b) return missingScreen();
  const body = b.text
    ? `<div class="reader-body" id="readerBody">${esc(b.text)}</div>
       <p class="reader-note">В прототипе показан только отрывок.</p>`
    : `<div class="reader-body" id="readerBody">${esc(b.about)}</div>
       <p class="reader-note">Полный текст появится после оцифровки.${b.code ? ` Пока книгу можно получить по шифру ${esc(b.code)}.` : ''}</p>`;
  return {
    title: b.title,
    bind,
    html: `
    <div class="reader">
      <div class="reader-bar">
        <a class="back" href="#/book/${encodeURIComponent(b.id)}">Назад</a>
        ${b.text ? `<div class="reader-tools" role="group" aria-label="Размер текста">
          <button type="button" id="fontDown" aria-label="Уменьшить шрифт">А−</button>
          <button type="button" id="fontUp" aria-label="Увеличить шрифт">А+</button>
        </div>` : ''}
      </div>
      <aside class="reader-aside book-cover">${cover(b, { named: true })}</aside>
      <article class="reader-page">
        <p class="reader-author">${esc(b.author)}</p>
        <h1>${esc(b.title)}</h1>
        ${body}
      </article>
    </div>`,
  };
}

function bind() {
  const body = document.getElementById('readerBody');
  const down = document.getElementById('fontDown');
  const up = document.getElementById('fontUp');
  let size = store.fontSize();
  const apply = () => {
    body.style.fontSize = `${size}px`;
    if (!down) return;
    down.disabled = size === FONT_SIZE.min;
    up.disabled = size === FONT_SIZE.max;
  };
  const setSize = (next) => {
    size = clampFontSize(next);
    apply();
    store.setFontSize(size);
  };
  apply();
  down?.addEventListener('click', () => setSize(size - 2));
  up?.addEventListener('click', () => setSize(size + 2));
}
