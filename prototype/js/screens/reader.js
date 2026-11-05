/* Страницы издания из сканов: титул, оглавление и то, что ещё было снято */
import { cover } from '../components.js';
import { esc } from '../format.js';
import { library } from '../library.js';
import { missingScreen } from './missing.js';

export function readerScreen({ id }) {
  const b = library.get(id);
  if (!b) return missingScreen();
  const pages = Array.from({ length: b.scans }, (_, i) => (
    `<img class="reader-scan" src="scans/${encodeURIComponent(b.id)}/${i + 1}.jpg" width="1200" height="1700" alt="Страница ${i + 1}" loading="lazy" decoding="async">`
  )).join('');
  return {
    title: b.title,
    html: `
    <div class="reader">
      <div class="reader-bar">
        <a class="back" href="#/book/${encodeURIComponent(b.id)}">Назад</a>
      </div>
      <aside class="reader-aside book-cover">${cover(b, { named: true })}</aside>
      <article class="reader-page">
        <p class="reader-author">${esc(b.author)}</p>
        <h1>${esc(b.title)}</h1>
        <p class="reader-note">Здесь страницы из скана. Полный текст появится после оцифровки.</p>
        <div class="reader-scans">${pages}</div>
      </article>
    </div>`,
  };
}
