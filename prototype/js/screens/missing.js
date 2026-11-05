import { newestBlock } from '../components.js';

export function missingScreen() {
  return {
    title: 'Страница не найдена',
    html: `<div class="wrap wrap-page"><div class="empty"><h1>Такой страницы нет</h1>
      <p>Книгу можно найти через каталог.</p><a class="btn btn-main" href="#/catalog">Открыть каталог</a></div>
      ${newestBlock()}</div>`,
  };
}
