/* Локальное хранилище: полка и тема лежат в браузере */
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

export const store = {
  shelf() {
    const ids = read('shelf');
    return Array.isArray(ids) ? [...new Set(ids.filter((id) => typeof id === 'string' && library.has(id)))] : [];
  },
  toggleShelf(id) {
    const shelf = store.shelf();
    write('shelf', shelf.includes(id) ? shelf.filter((x) => x !== id) : [...shelf, id]);
  },
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
