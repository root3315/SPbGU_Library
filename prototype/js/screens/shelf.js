import { readableNowBlock, tile } from '../components.js';
import { library } from '../library.js';
import { store } from '../store.js';

export function shelfScreen() {
  const books = library.getMany(store.shelf());
  return {
    title: 'Моя полка',
    html: `
    <div class="wrap wrap-page">
      <h1>Моя полка</h1>
      ${books.length
    ? `<ul class="tiles tiles-fill">${books.map(tile).join('')}</ul>`
    : `<div class="empty"><p>Откройте книгу и нажмите «На мою полку», чтобы она появилась здесь.</p>
         <a class="btn btn-main" href="#/catalog">Открыть каталог</a></div>
       ${readableNowBlock()}`}
    </div>`,
  };
}
