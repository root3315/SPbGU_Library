/* Состояние навигации. Отдельный файл нужен, чтобы экраны не зависели от роутера */
export const addressKey = () => location.hash || '#/';

export const nav = {
  address: addressKey(),
  catalog: '#/catalog',
  back: { label: 'Каталог', href: () => nav.catalog },
  lastBook: null,
  linkClick: false,
  restoreScroll: false,
  positions: new Map(),
  controller: null,
};
