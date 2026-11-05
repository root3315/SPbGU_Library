/* Состояние навигации. Отдельный файл нужен, чтобы экраны не зависели от роутера */
export const addressKey = () => location.hash || '#/';

function savedCatalog() {
  try {
    return sessionStorage.getItem('catalog') || '#/catalog';
  } catch {
    return '#/catalog';
  }
}

export const nav = {
  address: addressKey(),
  catalog: savedCatalog(),
  heroQuery: '',
  back: { label: 'Каталог', href: () => nav.catalog },
  lastBook: null,
  cameFromBook: false,
  linkClick: false,
  restoreScroll: false,
  positions: new Map(),
  controller: null,
};
