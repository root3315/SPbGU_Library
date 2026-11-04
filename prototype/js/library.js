/* Доступ к данным книг и поиск по ним */
import { ACCESS, BOOKS, COURSES, SECTIONS } from './data.js';

const byId = Object.assign(Object.create(null), Object.fromEntries(BOOKS.map((b) => [b.id, b])));

/* Поиск: слова в любом порядке, окончания и одна опечатка */
const norm = (s) => String(s).toLowerCase().replace(/ё/g, 'е');
const words = (s) => norm(s).replace(/[.,;:!?«»"()/]/g, ' ').split(/\s+/).filter(Boolean);
const searchIndex = new Map(BOOKS.map((b) => [b.id, words(
  `${b.title} ${b.author} ${b.fullAuthor} ${b.year} ${SECTIONS[b.section]} ${b.about} ${b.code}`,
)]));

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
    || (query.length >= 6 && !/\d/.test(query) && oneEditAway(query, word)));
}

function matches(b, query) {
  const terms = words(query).filter((word) => /[\p{L}\p{N}]/u.test(word));
  return terms.length > 0 && terms.every((word) => wordMatches(word, searchIndex.get(b.id)));
}

export const SORTS = {
  title: { label: 'по алфавиту', compare: (a, b) => a.title.localeCompare(b.title, 'ru') },
  new: { label: 'новые', compare: (a, b) => b.year - a.year },
  old: { label: 'старые', compare: (a, b) => a.year - b.year },
};

export const library = {
  sections: SECTIONS,
  access: ACCESS,
  has: (id) => Boolean(byId[id]),
  get: (id) => byId[id],
  getMany: (ids) => ids.map((id) => byId[id]).filter(Boolean),
  search: (query) => BOOKS.filter((b) => matches(b, query)),
  readable: () => BOOKS.filter((b) => b.access === 'online'),
  courses: () => COURSES.map((id) => byId[id]),
  countInSection: (section) => BOOKS.filter((b) => b.section === section).length,
  related(b, limit) {
    const others = BOOKS.filter((x) => x.id !== b.id);
    const sameSection = others.filter((x) => x.section === b.section);
    return [...sameSection, ...others.filter((x) => x.section !== b.section)].slice(0, limit);
  },
  list({ q = '', section = '', access = '', sort = 'title' }) {
    return BOOKS
      .filter((b) => (!section || b.section === section)
        && (!access || b.access === access)
        && (!q.trim() || matches(b, q)))
      .sort(SORTS[sort].compare);
  },
};
