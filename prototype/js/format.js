/* Мелкие помощники без состояния и без зависимостей */

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

export const hashCode = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/* Мягкие переносы в длинных словах: встроенного словаря для русского в браузере может не быть */
export const hyphenate = (text, min = 10) => text.replace(new RegExp(`[a-zа-яёўқғҳ]{${min},}`, 'gi'), (word) => word.replace(
  /[aeiouаеёиоуўыэюя][bcdfghjklmnpqrstvwxyzбвгғджзйклмнпқрстфхҳцчшщ]?(?=[bcdfghjklmnpqrstvwxyzбвгғджзйклмнпқрстфхҳцчшщ][aeiouаеёиоуўыэюя][a-zа-яёўқғҳ])/gi,
  (part, offset) => (offset === 0 && part.length === 1 ? part : `${part}\u00AD`),
));

const plural = (n, one, few, many) => {
  const a = n % 100; const b = n % 10;
  if (a > 10 && a < 20) return many;
  if (b === 1) return one;
  return b > 1 && b < 5 ? few : many;
};
export const countBooks = (n) => `${n} ${plural(n, 'книга', 'книги', 'книг')}`;
export const countPages = (n) => `${n} ${plural(n, 'страница', 'страницы', 'страниц')}`;

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const SHEET_QUERY = '(max-width: 860px)';
export const isSheetLayout = () => matchMedia(SHEET_QUERY).matches;

export function withTransition(update) {
  if (!document.startViewTransition || reducedMotion() || document.hidden) {
    update();
    return;
  }
  const transition = document.startViewTransition(update);
  /* Быстрое переключение обрывает предыдущий переход: это нормально */
  transition.ready.catch(() => {});
  transition.finished.catch(() => {});
}
