/* Общие куски разметки */
import { countPages, esc, hashCode, hyphenate } from './format.js';
import { library } from './library.js';

/* Издание без снимка обложки получает свою: цвет по разделу, рисунок по языку */
const SECTION_COLORS = {
  law: ['#6f1d24', '#8a2a22', '#4b1f2e'],
  soc: ['#1f3a5c', '#22483f', '#3a3556'],
  tech: ['#124a52', '#1e4470', '#2b3b46'],
  hist: ['#6a4520', '#5b2f22'],
  lit: ['#3f2f55', '#7a2b3a'],
};
const ACCENT = '#e9d8b4';

const svg = (inner) => `<svg class="cover-art" viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${inner}</svg>`;

/* Узбекские издания: орнамент из звёзд или кругов */
function ornamentArt(h) {
  const id = `ornament-${h % 2}`;
  const tile = h % 2
    ? '<path d="M8.3 8.3h23.4v23.4H8.3zM20 3.5 36.5 20 20 36.5 3.5 20z"/>'
    : '<circle cx="20" cy="20" r="14"/><circle cx="0" cy="0" r="14"/><circle cx="40" cy="0" r="14"/><circle cx="0" cy="40" r="14"/><circle cx="40" cy="40" r="14"/>';
  return svg(`<defs><pattern id="${id}" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="scale(.9)">
    <g fill="none" stroke="${ACCENT}" stroke-width="1.1" opacity=".5">${tile}</g></pattern></defs>
    <rect width="200" height="300" fill="url(#${id})"/>`);
}

/* Большой круг в нижнем углу, положение зависит от издания */
function arcArt(h) {
  const x = 110 + (h >>> 2) % 80;
  const y = 205 + (h >>> 6) % 45;
  const r = 86 + (h >>> 9) % 40;
  return svg(`<circle cx="${x}" cy="${y}" r="${r}" fill="${ACCENT}" opacity=".14"/>
    <circle cx="${x}" cy="${y}" r="${r + 16}" fill="none" stroke="${ACCENT}" stroke-width="1.2" opacity=".5"/>`);
}

/* Полосы разной ширины над светлой табличкой с названием */
function stripesArt(h) {
  let x = 16;
  let bars = '';
  for (let i = 0; x < 200; i += 1) {
    const width = 6 + ((h >>> (i * 3)) & 7) * 3;
    bars += `<rect x="${x}" width="${width}" height="300" fill="${ACCENT}" opacity="${i % 2 ? '.12' : '.26'}"/>`;
    x += width + 8;
  }
  return svg(bars);
}

function generatedFace(b, h) {
  const size = b.title.length > 72 ? 'xxl' : b.title.length > 42 ? 'xl' : b.title.length > 22 ? 'l' : 'm';
  const layout = b.lang === 'uz' ? 'ornament' : (h >>> 4) % 2 ? 'arc' : 'plate';
  const art = { ornament: ornamentArt, arc: arcArt, plate: stripesArt }[layout](h);
  return `<span class="cover" data-size="${size}" data-layout="${layout}">
    ${art}
    <span class="cover-text">
      <span class="cover-title">${hyphenate(esc(b.title))}</span>
      <span class="cover-author">${esc(b.author)}</span>
    </span>
  </span>`;
}

/* Толщина идёт от корня числа страниц: иначе 40 и 1800 страниц не поместятся в один масштаб */
export function cover(b, { named = false } = {}) {
  const h = hashCode(b.id);
  const colors = SECTION_COLORS[b.section];
  const color = b.color || colors[h % colors.length];
  const depth = (0.05 + 0.33 * Math.sqrt((b.pages || 300) / 1800)).toFixed(3);
  const name = named ? ` style="view-transition-name:cover-${esc(b.id)}"` : '';
  const face = b.image
    ? `<span class="cover cover-scan"><img src="${esc(b.image)}" alt="" loading="lazy" decoding="async"></span>`
    : generatedFace(b, h);
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
    ${b.pages ? `<span class="tile-pages">${countPages(b.pages)}</span>` : ''}
  </a></li>`;
}

export function resultItem(b) {
  return `<li><a class="result" href="#/book/${encodeURIComponent(b.id)}">
    ${cover(b)}
    <span>
      <span class="result-title">${esc(b.title)}</span>
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
