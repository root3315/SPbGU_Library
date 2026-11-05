/* Доступ к данным книг и поиск по ним */
import { BOOKS, LANGUAGES, SECTIONS } from './data.js';

const byId = Object.assign(Object.create(null), Object.fromEntries(BOOKS.map((b) => [b.id, b])));

/* Поиск: слова в любом порядке, окончания и одна опечатка */
/* Узбекские буквы приравнены к русским: на русской клавиатуре их нет */
const UZBEK = { ў: 'у', қ: 'к', ғ: 'г', ҳ: 'х' };
const norm = (s) => String(s).toLowerCase().replace(/ё/g, 'е').replace(/[ўқғҳ]/g, (c) => UZBEK[c]);
const words = (s) => norm(s).replace(/[.,;:!?«»"()/]/g, ' ').split(/\s+/).filter(Boolean);
const searchIndex = new Map(BOOKS.map((b) => [b.id, words(
  `${b.title} ${b.author} ${b.fullAuthor} ${b.year ?? ''} ${SECTIONS[b.section]} ${b.about}`,
).flatMap((word) => [word, ...word.split('-')])]));

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

function matches(b, query) {
  const terms = words(query).filter((word) => /[\p{L}\p{N}]/u.test(word));
  return terms.length > 0 && terms.every((word) => wordMatches(word, searchIndex.get(b.id)));
}

export const SORTS = {
  title: { label: 'по алфавиту', compare: (a, b) => a.title.localeCompare(b.title, 'ru') },
  new: { label: 'новые', compare: (a, b) => (b.year ?? -Infinity) - (a.year ?? -Infinity) || 0 },
  old: { label: 'старые', compare: (a, b) => (a.year ?? Infinity) - (b.year ?? Infinity) || 0 },
};

export const library = {
  sections: SECTIONS,
  languages: LANGUAGES,
  has: (id) => Boolean(byId[id]),
  get: (id) => byId[id],
  getMany: (ids) => ids.map((id) => byId[id]).filter(Boolean),
  search: (query) => BOOKS.filter((b) => matches(b, query)),
  newest: (limit) => [...BOOKS].sort(SORTS.new.compare).slice(0, limit),
  university: () => BOOKS.filter((b) => b.spbu),
  countInSection: (section) => BOOKS.filter((b) => b.section === section).length,
  related(b, limit) {
    const others = BOOKS.filter((x) => x.id !== b.id);
    const sameSection = others.filter((x) => x.section === b.section);
    return [...sameSection, ...others.filter((x) => x.section !== b.section)].slice(0, limit);
  },
  list({ q = '', section = '', lang = '', sort = 'title' }) {
    return BOOKS
      .filter((b) => (!section || b.section === section)
        && (!lang || b.lang === lang)
        && (!q.trim() || matches(b, q)))
      .sort(SORTS[sort].compare);
  },
};
