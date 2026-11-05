/* Доступ к данным книг и поиск по ним */
import { BOOKS, LANGUAGES, SECTIONS } from './data.js';

const byId = Object.assign(Object.create(null), Object.fromEntries(BOOKS.map((b) => [b.id, b])));

/* Поиск: слова в любом порядке, окончания и одна опечатка.
   Кириллица и латиница сводятся к одному ключу: узбекские книги ищут на обоих алфавитах */
const TO_LATIN = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'j', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 's', ч: 'ch', ш: 'sh', щ: 'sh',
  ъ: '', ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya', ў: 'u', қ: 'k', ғ: 'g', ҳ: 'h',
};
const norm = (s) => String(s).toLowerCase()
  .replace(/­/g, '')
  .replace(/o['ʻʼ‘’`]/g, 'u')
  .replace(/g['ʻʼ‘’`]/g, 'g')
  .replace(/['ʻʼ‘’`]/g, '')
  .replace(/[а-яёўқғҳ]/g, (c) => TO_LATIN[c])
  .replace(/q/g, 'k')
  .replace(/x/g, 'h');
const words = (s) => norm(s).replace(/[.,;:!?«»"()/]/g, ' ').split(/\s+/).filter(Boolean)
  .flatMap((word) => [word, ...word.split('-')]);
const searchIndex = new Map(BOOKS.map((b) => [b.id, {
  title: words(b.title),
  author: words(`${b.author} ${b.fullAuthor}`),
  rest: words(`${b.year ?? ''} ${SECTIONS[b.section]} ${b.about} ${b.keywords ?? ''}`),
}]));

function oneEditAway(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  const rest = (x, n) => x.slice(i + n);
  return rest(a, 1) === rest(b, 1) || rest(a, 1) === rest(b, 0) || rest(a, 0) === rest(b, 1)
    || (a[i] === b[i + 1] && a[i + 1] === b[i] && rest(a, 2) === rest(b, 2));
}

/* Основа слова без окончания: «Толстого» находит «Толстой» */
const stem = (query) => (/\d/.test(query) ? query : query.slice(0, query.length - Math.max(0, Math.min(3, query.length - 4))));

function wordMatches(query, candidates) {
  const base = stem(query);
  return candidates.some((word) => word.startsWith(base)
    || (query.length >= 6 && !/\d/.test(query)
      && (oneEditAway(query, word) || (base.length >= 6 && oneEditAway(base, word.slice(0, base.length))))));
}

/* Вес совпадения: название важнее автора, автор важнее описания. 0 значит «не подходит» */
function score(b, query) {
  const terms = words(query).filter((word) => /[\p{L}\p{N}]/u.test(word));
  const { title, author, rest } = searchIndex.get(b.id);
  let total = 0;
  for (const word of terms) {
    if (wordMatches(word, title)) total += 3;
    else if (wordMatches(word, author)) total += 2;
    else if (wordMatches(word, rest)) total += 1;
    else return 0;
  }
  return total;
}
const byTitle = (a, b) => a.title.localeCompare(b.title, 'ru');

export const SORTS = {
  match: { label: 'подходящие', compare: byTitle },
  title: { label: 'по алфавиту', compare: byTitle },
  new: { label: 'новые', compare: (a, b) => (b.year ?? -Infinity) - (a.year ?? -Infinity) || 0 },
  old: { label: 'старые', compare: (a, b) => (a.year ?? Infinity) - (b.year ?? Infinity) || 0 },
};

export const library = {
  sections: SECTIONS,
  languages: LANGUAGES,
  has: (id) => Boolean(byId[id]),
  get: (id) => byId[id],
  getMany: (ids) => ids.map((id) => byId[id]).filter(Boolean),
  search: (query) => BOOKS.filter((b) => score(b, query) > 0)
    .sort((a, b) => score(b, query) - score(a, query) || byTitle(a, b)),
  total: BOOKS.length,
  featured: (limit) => [...BOOKS].filter((b) => b.image).sort(SORTS.new.compare).slice(0, limit),
  newest: (limit) => [...BOOKS].sort(SORTS.new.compare).slice(0, limit),
  university: () => BOOKS.filter((b) => b.spbu),
  countInSection: (section) => BOOKS.filter((b) => b.section === section).length,
  related(b, limit) {
    const others = BOOKS.filter((x) => x.id !== b.id);
    const sameSection = others.filter((x) => x.section === b.section);
    return [...sameSection, ...others.filter((x) => x.section !== b.section)].slice(0, limit);
  },
  list({ q = '', section = '', lang = '', sort = 'match' }) {
    const found = BOOKS.filter((b) => (!section || b.section === section)
      && (!lang || b.lang === lang)
      && (!q.trim() || score(b, q) > 0));
    return sort === 'match' && q.trim()
      ? found.sort((a, b) => score(b, q) - score(a, q) || byTitle(a, b))
      : found.sort(SORTS[sort].compare);
  },
};
