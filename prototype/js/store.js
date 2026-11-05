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
    return Number.isFinite(size) ? Math.min(28, Math.max(16, size)) : defaultFontSize();
  },
  setFontSize: (size) => write('reader', { size }),
  setTheme: (theme) => write('theme', theme),
  markSplashShown() {
    try {
      sessionStorage.setItem('splash', '1');
    } catch { /* приватный режим */ }
  },
};

export function updateShelfCount() {
  const count = store.shelf().length;
  document.querySelectorAll('[data-shelf-count]').forEach((el) => {
    if (count) el.textContent = count;
    el.classList.toggle('on', count > 0);
  });
}
