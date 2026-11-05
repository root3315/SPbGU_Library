/* Локальное хранилище: сервера у прототипа нет, всё лежит в браузере */
import { library } from './library.js';

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* приватный режим */ }
}

const defaultFontSize = () => (innerWidth < 560 ? 18 : 20);
export const FONT_SIZE = { min: 16, max: 28 };
export const clampFontSize = (size) => Math.min(FONT_SIZE.max, Math.max(FONT_SIZE.min, size));

export const store = {
  shelf() {
    const ids = read('shelf');
    return Array.isArray(ids) ? [...new Set(ids.filter((id) => typeof id === 'string' && library.has(id)))] : [];
  },
  toggleShelf(id) {
    const shelf = store.shelf();
    write('shelf', shelf.includes(id) ? shelf.filter((x) => x !== id) : [...shelf, id]);
  },
  fontSize() {
    const size = read('reader')?.size;
    return Number.isFinite(size) ? clampFontSize(size) : defaultFontSize();
  },
  setFontSize: (size) => write('reader', { size }),
  setTheme: (theme) => write('theme', theme),
};

export function updateShelfCount() {
  const count = store.shelf().length;
  document.querySelectorAll('[data-shelf-count]').forEach((el) => {
    if (count) el.textContent = count;
    el.classList.toggle('on', count > 0);
    el.setAttribute('aria-hidden', String(!count));
  });
}
