import { resultItem, tile } from '../components.js';
import { countBooks, esc, isSheetLayout, reducedMotion } from '../format.js';
import { library } from '../library.js';
import { nav } from '../nav.js';

export function homeScreen() {
  const sections = Object.entries(library.sections).map(([key, name]) => (
    `<a class="section-tile" href="#/catalog?s=${encodeURIComponent(key)}"><b>${esc(name)}</b><span>${countBooks(library.countInSection(key))}</span></a>`
  )).join('');

  return {
    title: '',
    bind,
    html: `
    <div class="wrap">
      <section class="hero">
        <div class="hero-main">
          <h1>Какая книга вам нужна?</h1>
          <div class="search-card" id="heroCard">
            <form id="heroSearch" role="search">
              <label class="sr" for="heroQ">Книга или автор</label>
              <div class="search-row">
                <input id="heroQ" type="search" placeholder="Книга или автор" autocomplete="off">
                <button type="submit" class="btn btn-main">Найти</button>
              </div>
            </form>
            <div class="results" id="heroResults"></div>
            <p class="sr" id="heroStatus" role="status"></p>
          </div>
          <p class="hero-note">В каталоге ${countBooks(library.total)}. Пока доступны титулы и оглавления.</p>
          <p class="often">Часто ищут:
            <button type="button" data-try="Бегалов">Бегалов</button>,
            <button type="button" data-try="пенсия">пенсия</button>,
            <button type="button" data-try="Узбекистан">Узбекистан</button>
          </p>
        </div>
        <div class="hero-side">
          <h2>Новые издания</h2>
          <ul class="tiles tiles-3">${library.featured(3).map(tile).join('')}</ul>
        </div>
      </section>

      <section class="block">
        <h2>Разделы</h2>
        <div class="section-grid">${sections}</div>
      </section>

      <section class="block">
        <h2>Издания Санкт-Петербургского университета</h2>
        <ul class="tiles tiles-row">${library.university().map(tile).join('')}</ul>
      </section>
    </div>`,
  };
}

function bind(signal) {
  const input = document.getElementById('heroQ');
  const box = document.getElementById('heroResults');
  const card = document.getElementById('heroCard');
  const status = document.getElementById('heroStatus');

  const close = () => box.classList.remove('open');
  const show = () => {
    const q = input.value.trim();
    if (!q) {
      close();
      status.textContent = '';
      return;
    }
    const found = library.search(q);
    status.textContent = found.length ? `Нашлось ${countBooks(found.length)}` : 'Ничего не нашлось';
    box.innerHTML = found.length
      ? `<ul>${found.slice(0, 4).map(resultItem).join('')}</ul>${found.length > 4
        ? `<a class="more" href="#/catalog?q=${encodeURIComponent(q)}">Показать все ${countBooks(found.length)}</a>` : ''}`
      : `<p class="none">По запросу «${esc(q)}» ничего нет. Проверьте написание или <a href="#/catalog">откройте каталог</a>.</p>`;
    box.classList.add('open');
  };

  input.value = nav.heroQuery;
  input.addEventListener('input', () => {
    nav.heroQuery = input.value;
    show();
  });
  input.addEventListener('focus', () => {
    show();
    if (isSheetLayout()) card.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' });
  });
  box.addEventListener('transitionend', () => {
    if (!box.classList.contains('open')) box.innerHTML = '';
  });
  card.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (e.target === input) {
      input.value = '';
      nav.heroQuery = '';
      status.textContent = '';
    } else {
      input.focus();
    }
    close();
  });
  card.addEventListener('focusout', (e) => {
    if (e.relatedTarget && !card.contains(e.relatedTarget)) close();
  });
  document.addEventListener('pointerdown', (e) => {
    if (!e.target.closest?.('#heroCard, [data-try]')) close();
  }, { signal });
  document.querySelectorAll('[data-try]').forEach((btn) => btn.addEventListener('click', () => {
    input.value = btn.dataset.try;
    input.focus();
    show();
  }));
  document.getElementById('heroSearch').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    nav.linkClick = true;
    location.hash = q ? `#/catalog?q=${encodeURIComponent(q)}` : '#/catalog';
  });
}
