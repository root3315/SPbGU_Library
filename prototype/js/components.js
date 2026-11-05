/* Общие куски разметки */
import { countPages, esc, hashCode, hyphenate } from './format.js';
import { library } from './library.js';

/* Цвета условных обложек: фон и текст */
const COVER_COLORS = [
  ['#9f2d20', '#fff'], ['#1f3f3a', '#fff'], ['#27324f', '#fff'], ['#5d4128', '#fff'],
  ['#2e2e33', '#fff'], ['#4a3350', '#fff'], ['#7a1f2b', '#fff'], ['#e6e0d0', '#2a2620'],
];

/* Толщина идёт от корня числа страниц: иначе 40 и 1800 страниц не поместятся в один масштаб.
   Если скана нет, обложка собирается из данных книги. У книги со сканом задаются image и color */
export function cover(b, { named = false } = {}) {
  const size = b.title.length > 42 ? 'xl' : b.title.length > 22 ? 'l' : 'm';
  const h = hashCode(b.id);
  const [generatedColor, textColor] = COVER_COLORS[h % COVER_COLORS.length];
  const color = b.color || generatedColor;
  const depth = (0.05 + 0.33 * Math.sqrt((b.pages || 300) / 1800)).toFixed(3);
  const name = named ? ` style="view-transition-name:cover-${esc(b.id)}"` : '';
  const face = b.image
    ? `<span class="cover cover-scan"><img src="${esc(b.image)}" alt="" loading="lazy" decoding="async"></span>`
    : `<span class="cover" data-size="${size}" data-layout="${(h >>> 4) % 3}" style="--t:${textColor}">
        <span class="cover-author">${esc(b.author)}</span>
        <span class="cover-title">${esc(b.title)}</span>
      </span>`;
  return `<span class="volume-box"${name} aria-hidden="true">
    <span class="volume" style="--depth:${depth};--c:${esc(color)}">
      ${face}
      <span class="edge edge-pages"></span>
      <span class="edge edge-top"></span>
      <span class="edge edge-spine"></span>
    </span>
  </span>`;
}

export function tile(b) {
  return `<li><a class="tile" href="#/book/${encodeURIComponent(b.id)}" data-book="${esc(b.id)}">
    ${cover(b)}
    <span class="tile-title">${hyphenate(esc(b.title))}</span>
    <span class="tile-author">${esc(b.author)}</span>
    <span class="tile-pages">${countPages(b.pages)}</span>
  </a></li>`;
}

export function resultItem(b) {
  return `<li><a class="result" href="#/book/${encodeURIComponent(b.id)}">
    ${cover(b)}
    <span>
      <span class="result-title">${esc(b.title)}</span>
      <span class="result-author">${esc(b.author)}, ${b.year}</span>
    </span>
  </a></li>`;
}

export function readableNowBlock() {
  return `<section class="block">
    <h2>Можно читать прямо сейчас</h2>
    <ul class="tiles tiles-row">${library.readable().map(tile).join('')}</ul>
  </section>`;
}
