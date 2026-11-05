/* Общие куски разметки */
import { esc, hashCode, hyphenate, pagesText } from './format.js';
import { library } from './library.js';

/* Издание без снимка обложки: цветной переплёт и светлый ярлык, у узбекских изданий внизу орнамент */
const BINDINGS = ['#6f2a2a', '#25405c', '#2f4f45', '#4a4038', '#7a6a4f', '#8c8578', '#54405c', '#7a3a2c'];

/* Плитка 40 и полоса 80: ровно две строки целых звёзд на всю ширину */
const ORNAMENT = `<svg class="cover-art" viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs><pattern id="cover-ornament" width="40" height="40" patternUnits="userSpaceOnUse" y="220">
    <path d="M8.3 8.3h23.4v23.4H8.3zM20 3.5 36.5 20 20 36.5 3.5 20z" fill="none" stroke="#f3ecdd" stroke-width="1.1" opacity=".42"/>
  </pattern></defs>
  <rect y="220" width="200" height="80" fill="url(#cover-ornament)"/>
</svg>`;

/* На обложке короткое название: подзаголовок и хвост остаются в подписи */
function shortTitle(title) {
  const head = title.split(':')[0].trim();
  const parts = head.split(/\s+/);
  return parts.length > 7 ? `${parts.slice(0, 7).join(' ')}…` : head;
}

function generatedFace(b) {
  const title = shortTitle(b.title);
  const longest = Math.max(...title.split(/\s+/).map((word) => word.length));
  /* Кегль подбирается под самое длинное слово, чтобы оно не рвалось */
  const size = Math.min(title.length > 44 ? 8.8 : 10.4, 98 / longest).toFixed(1);
  return `<span class="cover">
    ${b.lang === 'uz' ? ORNAMENT : ''}
    <span class="cover-label">
      <span class="cover-title" lang="${esc(b.lang)}" style="font-size:${size}cqw">${esc(title)}</span>
      <span class="cover-author">${esc(b.author)}</span>
    </span>
  </span>`;
}

/* Толщина идёт от корня числа страниц: иначе 40 и 1800 страниц не поместятся в один масштаб */
export function cover(b, { named = false } = {}) {
  const h = hashCode(b.id);
  const color = b.color || BINDINGS[h % BINDINGS.length];
  const depth = (0.05 + 0.33 * Math.sqrt((b.pages || 300) / 1800)).toFixed(3);
  const name = named ? ` style="view-transition-name:cover-${esc(b.id)}"` : '';
  const face = b.image
    ? `<span class="cover cover-scan"><img src="${esc(b.image)}" alt="" loading="lazy" decoding="async"></span>`
    : generatedFace(b);
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
    <span class="tile-title" lang="${esc(b.lang)}">${hyphenate(esc(b.title))}</span>
    <span class="tile-author">${esc(b.author)}${b.year ? `, ${b.year}` : ''}</span>
    <span class="tile-pages">${pagesText(b)}</span>
  </a></li>`;
}

export function resultItem(b) {
  return `<li><a class="result" href="#/book/${encodeURIComponent(b.id)}">
    ${cover(b)}
    <span>
      <span class="result-title" lang="${esc(b.lang)}">${esc(b.title)}</span>
      <span class="result-author">${esc(b.author)}${b.year ? `, ${b.year}` : ''}</span>
    </span>
  </a></li>`;
}

export function newestBlock() {
  return `<section class="block">
    <h2>Новые издания</h2>
    <ul class="tiles tiles-row">${library.newest(10).map(tile).join('')}</ul>
  </section>`;
}
