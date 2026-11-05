/* Книга с перелистыванием: разворот на широком экране, одна страница на узком.
   Страницы лежат картинками и не трогаются до конца переворота: иначе при наведении дрогнет текст.
   На холсте поверх них рисуются только открывшийся кусок следующей страницы и сам лист.
   Геометрия считается для правой страницы: лист сгибается по серединному перпендикуляру
   между углом листа и точкой, куда этот угол тянут. Левая сторона получается зеркалом */
import { reducedMotion } from './format.js';

const PAPER = '#f7f4ec';

const dot = (a, b) => a.x * b.x + a.y * b.y;
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/* Часть многоугольника по одну сторону прямой */
function cut(polygon, point, normal, side) {
  const out = [];
  polygon.forEach((a, i) => {
    const b = polygon[(i + 1) % polygon.length];
    const da = dot(sub(a, point), normal) * side;
    const db = dot(sub(b, point), normal) * side;
    if (da >= 0) out.push(a);
    if (da * db < 0) {
      const t = da / (da - db);
      out.push({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
    }
  });
  return out;
}

/* Угол листа не может отойти от корешка дальше ширины страницы и её диагонали */
function constrain(point, corner, w, h) {
  const near = { x: 0, y: corner.y };
  const far = { x: 0, y: h - corner.y };
  const limit = (p, center, radius) => {
    const d = sub(p, center);
    const length = Math.hypot(d.x, d.y);
    return length > radius ? { x: center.x + (d.x / length) * radius, y: center.y + (d.y / length) * radius } : p;
  };
  return limit(limit(point, near, w), far, Math.hypot(w, h));
}

export function createFlipbook({ root, total, thickness, url, label, coverColor, start, onChange, onPreview, onError, signal }) {
  root.style.setProperty('--book-cover', coverColor);
  root.innerHTML = `
    <div class="flip-stack flip-stack-left"></div>
    <div class="flip-page flip-left"><img alt="" draggable="false"></div>
    <div class="flip-page flip-right"><img alt="" draggable="false"></div>
    <div class="flip-stack flip-stack-right"></div>`;
  const canvas = document.createElement('canvas');
  canvas.className = 'flip-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
  const ctx = canvas.getContext('2d');
  const slots = { left: root.querySelector('.flip-left'), right: root.querySelector('.flip-right') };
  const stacks = { left: root.querySelector('.flip-stack-left'), right: root.querySelector('.flip-stack-right') };
  const images = new Map();
  /* Разворот, когда две страницы помещаются рядом: широкий экран или телефон лёжа */
  const screen = matchMedia('(min-width: 861px), (min-width: 560px) and (orientation: landscape)');
  const wide = { get matches() { return screen.matches && total > 1; } };

  let spread = 0;
  let session = null;
  let frame = 0;
  let clearing = 0;
  let large = false;

  /* Разворот: на первом слева форзац, дальше страницы парами */
  const spreadOf = (page) => (wide.matches ? Math.floor(page / 2) : page - 1);
  const lastSpread = () => spreadOf(total);
  const pagesOf = (index) => {
    if (!wide.matches) return { left: null, right: index + 1 };
    const left = index === 0 ? null : index * 2;
    const right = index * 2 + 1 <= total ? index * 2 + 1 : null;
    return { left, right };
  };
  const firstPage = (index) => {
    const { left, right } = pagesOf(index);
    return left || right;
  };

  function load(page) {
    if (!page) return Promise.resolve(null);
    if (!images.has(page)) {
      let entry = null;
      entry = new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          entry.ready = image;
          resolve(image);
        };
        image.onerror = () => {
          images.delete(page);
          reject(new Error('page'));
        };
        image.src = url(page);
      });
      images.set(page, entry);
    }
    return images.get(page);
  }
  const loadSpread = (index) => (index < 0 || index > lastSpread() ? Promise.resolve([])
    : Promise.all(Object.values(pagesOf(index)).map(load)));
  const quietly = (promise) => promise.catch(() => {});

  function setSlot(slot, page) {
    const element = slots[slot];
    const image = element.firstElementChild;
    if (element.dataset.page === String(page)) return;
    element.dataset.page = page;
    element.classList.toggle('blank', !page);
    if (page) {
      image.src = url(page);
      image.alt = label(page);
    } else {
      image.removeAttribute('src');
      image.alt = '';
    }
  }

  /* Обрез толще у объёмных книг и растёт вместе с листом */
  function setStacks(index) {
    const share = lastSpread() ? index / lastSpread() : 0;
    const pageWidth = slots.right.getBoundingClientRect().width;
    const edge = Math.min(Math.max(6, thickness / 40), 22) * (pageWidth / 360);
    root.style.setProperty('--edge', `${Math.round(Math.min(wide.matches ? 28 : 10, Math.max(6, edge)))}px`);
    root.style.setProperty('--stack-left', share.toFixed(3));
    root.style.setProperty('--stack-right', (1 - share).toFixed(3));
  }

  function rest(index) {
    if (index === goal) goal = null;
    const { left, right } = pagesOf(index);
    setSlot('left', left);
    setSlot('right', right);
    setStacks(index);
    quietly(loadSpread(index + 1));
    quietly(loadSpread(index - 1));
  }

  /* Рабочая область холста: корешок и верх книги в координатах окна */
  function measure() {
    const right = slots.right.getBoundingClientRect();
    const spine = Math.round(right.left);
    const top = Math.round(right.top);
    return { spine, top, w: Math.round(right.right) - spine, h: Math.round(right.bottom) - top };
  }

  function fitCanvas() {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    const width = Math.round(innerWidth * ratio);
    const height = Math.round(innerHeight * ratio);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;
    }
    return ratio;
  }

  function trace(points) {
    ctx.beginPath();
    points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
  }

  /* Страница рисуется на своём месте в покое, поворот задаётся снаружи */
  function paintPage(page, slot, w, h) {
    const x = slot === 'right' ? 0 : -w;
    const image = page && images.get(page)?.ready;
    ctx.fillStyle = page === null ? coverColor : PAPER;
    ctx.fillRect(x, 0, w, h);
    if (image) {
      const scale = Math.min(w / image.naturalWidth, h / image.naturalHeight);
      const dw = image.naturalWidth * scale;
      const dh = image.naturalHeight * scale;
      ctx.drawImage(image, x + (slot === 'right' ? 0 : w - dw), (h - dh) / 2, dw, dh);
    }
    const shade = ctx.createLinearGradient(0, 0, slot === 'right' ? w * 0.09 : -w * 0.09, 0);
    shade.addColorStop(0, 'rgb(0 0 0 / 30%)');
    shade.addColorStop(0.17, 'rgb(0 0 0 / 12%)');
    shade.addColorStop(1, 'rgb(0 0 0 / 0%)');
    ctx.fillStyle = shade;
    ctx.fillRect(x, 0, w, h);
  }

  function drawSession() {
    const { spine, top, w, h } = measure();
    const ratio = fitCanvas();
    const { dir, corner } = session;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.translate(spine, top);
    const real = (p) => ({ x: dir * p.x, y: p.y });
    const c = { x: w, y: corner * h };
    const p = wide.matches ? constrain(session.point, c, w, h) : { ...session.point };
    const pull = sub(c, p);
    const length = Math.hypot(pull.x, pull.y);
    if (length < 0.5) {
      if (session.reversed) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, w, h);
        ctx.clip();
        paintPage(session.front, session.frontSlot, w, h);
        ctx.restore();
      }
      return;
    }
    const n = { x: pull.x / length, y: pull.y / length };
    const m = { x: (c.x + p.x) / 2, y: (c.y + p.y) / 2 };
    const rect = [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }];
    const front = cut(rect, m, n, -1);
    const reveal = cut(rect, m, n, 1);
    const reflect = (q) => {
      const d = 2 * dot(sub(q, m), n);
      return { x: q.x - d * n.x, y: q.y - d * n.y };
    };
    const leaf = reveal.map(reflect);
    const realN = real(n);
    const realM = real(m);
    const along = (distance) => ({ x: realM.x + realN.x * distance, y: realM.y + realN.y * distance });

    /* Открывшаяся страница в тени загибающегося листа */
    if (reveal.length > 2) {
      ctx.save();
      trace(reveal.map(real));
      ctx.clip();
      if (!session.reversed) paintPage(session.under, session.frontSlot, w, h);
      const from = along(0);
      const to = along(w * 0.28);
      const shadow = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
      shadow.addColorStop(0, 'rgb(0 0 0 / 30%)');
      shadow.addColorStop(1, 'rgb(0 0 0 / 0%)');
      ctx.fillStyle = shadow;
      ctx.fillRect(dir > 0 ? 0 : -w, 0, w, h);
      ctx.restore();
    }

    /* Прилетающий на узком экране лист: у остальных эта часть и есть страница под холстом */
    if (session.reversed && front.length > 2) {
      ctx.save();
      trace(front.map(real));
      ctx.clip();
      paintPage(session.front, session.frontSlot, w, h);
      ctx.restore();
    }

    if (leaf.length > 2) {
      const fade = wide.matches ? 1 : Math.min(1, Math.max(0, (p.x + w) / (w * 0.3)));
      ctx.globalAlpha = fade;
      ctx.save();
      ctx.shadowColor = 'rgb(0 0 0 / 38%)';
      ctx.shadowBlur = session.peek ? 18 : 34;
      ctx.shadowOffsetX = session.peek ? -4 * dir * ratio : 0;
      ctx.shadowOffsetY = session.peek ? -4 * ratio : 0;
      ctx.fillStyle = PAPER;
      trace(leaf.map(real));
      ctx.fill();
      ctx.restore();

      /* Оборот листа: страница отражена через корешок и через линию сгиба */
      ctx.save();
      trace(leaf.map(real));
      ctx.clip();
      const scale = 2 * dot(m, n);
      ctx.transform(
        2 * n.x * n.x - 1, 2 * n.x * n.y * dir,
        -2 * n.x * n.y * dir, 1 - 2 * n.y * n.y,
        dir * scale * n.x, scale * n.y,
      );
      paintPage(session.back, session.backSlot, w, h);
      /* У приподнятого угла виден край скана: бумага прячет фон сканера */
      if (session.peek) {
        ctx.globalAlpha = fade * 0.82;
        ctx.fillStyle = PAPER;
        ctx.fillRect(session.backSlot === 'right' ? 0 : -w, 0, w, h);
        ctx.globalAlpha = fade;
      }
      ctx.restore();

      /* Блик на изгибе: темно у сгиба, светлее на выпуклой части */
      ctx.save();
      trace(leaf.map(real));
      ctx.clip();
      const from = along(0);
      const to = along(-w * 0.55);
      const gloss = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
      gloss.addColorStop(0, 'rgb(0 0 0 / 26%)');
      gloss.addColorStop(0.07, 'rgb(0 0 0 / 8%)');
      gloss.addColorStop(0.24, 'rgb(255 255 255 / 22%)');
      gloss.addColorStop(0.5, 'rgb(255 255 255 / 0%)');
      gloss.addColorStop(1, 'rgb(0 0 0 / 8%)');
      ctx.fillStyle = gloss;
      ctx.fillRect(-3 * w, -2 * h, 6 * w, 5 * h);
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }

  function stopSession() {
    session = null;
    cancelAnimationFrame(frame);
    frame = 0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.classList.remove('on');
  }

  /* Холст убирается, когда страницы под ним уже отрисованы, иначе мелькнёт пустой лист */
  function settle(landed) {
    const finalSpread = landed ? session.target : spread;
    session = null;
    cancelAnimationFrame(frame);
    frame = 0;
    const moved = finalSpread !== spread;
    spread = finalSpread;
    rest(spread);
    clearing += 1;
    const id = clearing;
    const decoded = Object.values(slots).map((slot) => slot.firstElementChild)
      .filter((image) => image.getAttribute('src')).map((image) => image.decode().catch(() => {}));
    const wait = new Promise((resolve) => { setTimeout(resolve, 160); });
    Promise.race([Promise.all(decoded), wait]).then(() => {
      if (id === clearing && !session) stopSession();
    });
    if (moved) onChange(firstPage(spread), pagesOf(spread));
  }

  function tick(now) {
    if (!session) return;
    const s = session;
    if (s.auto) {
      const t = Math.min(1, (now - s.auto.start) / s.auto.duration);
      const e = easeInOut(t);
      s.point = {
        x: lerp(s.auto.from.x, s.auto.to.x, e),
        y: lerp(s.auto.from.y, s.auto.to.y, e) + Math.sin(Math.PI * e) * s.auto.lift,
      };
      drawSession();
      if (t >= 1) {
        settle(s.auto.complete);
        return;
      }
    } else {
      const step = 1 - Math.exp(-(now - (s.last ?? now - 16)) / (s.peek ? 130 : 60));
      s.last = now;
      s.point.x += (s.aim.x - s.point.x) * step;
      s.point.y += (s.aim.y - s.point.y) * step;
      drawSession();
      if (s.peek && !s.hovered && Math.hypot(s.point.x - s.aim.x, s.point.y - s.aim.y) < 0.6) {
        settle(false);
        return;
      }
    }
    frame = requestAnimationFrame(tick);
  }

  /* Подготовка переворота. На узком экране лист назад прилетает слева: это прямой переворот наоборот */
  function open(target, cornerY) {
    const forward = target > spread;
    const current = pagesOf(spread);
    const next = pagesOf(target);
    const { h, w } = measure();
    const reversed = !wide.matches && !forward;
    const dir = wide.matches && !forward ? -1 : 1;
    const corner = cornerY;
    let front;
    let back;
    let under;
    if (!wide.matches) {
      front = forward ? current.right : next.right;
      under = forward ? next.right : current.right;
    } else if (forward) {
      front = current.right;
      back = next.left;
      under = next.right;
    } else {
      front = current.left;
      back = next.right;
      under = next.left;
    }
    const home = { x: w, y: corner * h };
    const away = { x: -w, y: corner * h };
    session = {
      dir,
      corner,
      target,
      reversed,
      front,
      back,
      under,
      frontSlot: dir > 0 ? 'right' : 'left',
      backSlot: dir > 0 ? 'left' : 'right',
      home,
      away,
      point: reversed ? { ...away } : { ...home },
      aim: reversed ? { ...away } : { ...home },
    };
    clearing += 1;
    canvas.classList.add('on');
    drawSession();
    return session;
  }

  function play(complete) {
    const s = session;
    setStacks(complete ? s.target : spread);
    if (complete) onPreview(pagesOf(s.target));
    const towardsAway = s.reversed ? !complete : complete;
    const to = towardsAway ? s.away : s.home;
    const { h } = measure();
    const remaining = Math.hypot(to.x - s.point.x, to.y - s.point.y) / Math.max(1, 2 * s.home.x);
    s.peek = false;
    s.auto = {
      start: performance.now(),
      from: { ...s.point },
      to,
      complete,
      duration: Math.max(240, (620 + s.home.x * 0.25) * Math.min(1, remaining + 0.15)),
      lift: (s.corner ? -1 : 1) * h * 0.04 * Math.min(1, remaining * 2),
    };
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(tick);
  }

  const instant = (index) => {
    spread = index;
    rest(index);
    onChange(firstPage(index), pagesOf(index));
  };

  /* Страницы готовятся заранее: кадр переворота не должен ждать сеть */
  async function prepare(index) {
    await Promise.all([...Object.values(pagesOf(index)), ...Object.values(pagesOf(spread))].map(load));
  }

  /* Быстрые нажатия считаются от последней цели, а не от листа, который ещё летит */
  let request = 0;
  let goal = null;
  async function turnTo(index) {
    if (index < 0 || index > lastSpread()) return;
    goal = index;
    if (session?.auto) settle(session.auto.complete);
    else if (session) settle(false);
    if (index === spread) return;
    request += 1;
    const id = request;
    root.classList.add('busy');
    try {
      await prepare(index);
    } catch {
      if (id === request && !signal.aborted) onError(() => turnTo(index));
      return;
    } finally {
      if (id === request) root.classList.remove('busy');
    }
    if (id !== request || signal.aborted) return;
    if (large || reducedMotion()) {
      instant(index);
      return;
    }
    open(index, 1);
    play(true);
  }

  /* Перетаскивание за страницу и угол при наведении */
  const pointerSide = (e) => {
    const { spine, w } = measure();
    if (wide.matches) return e.clientX >= spine ? 1 : -1;
    return e.clientX >= spine + w * 0.5 ? 1 : -1;
  };
  const pointerPoint = (e, dir) => {
    const { spine, top } = measure();
    return { x: dir * (e.clientX - spine), y: e.clientY - top };
  };
  const cornerOf = (e) => {
    const { top, h } = measure();
    return e.clientY - top < h / 2 ? 0 : 1;
  };

  const peekZone = () => Math.min(180, Math.max(90, measure().w * 0.2));
  const peekAim = (e) => {
    const { w, h } = measure();
    const zone = peekZone();
    const point = pointerPoint(e, session.dir);
    const x = Math.min(w - w * 0.1, Math.max(w - zone, point.x));
    const inset = Math.min(zone * 0.8, Math.max(w * 0.08, session.corner ? h - point.y : point.y));
    return { x, y: session.corner ? h - inset : inset };
  };

  let press = null;
  function hasImages(index) {
    return Object.values({ ...pagesOf(index), ...pagesOf(spread) }).filter(Boolean)
      .every((page) => images.get(page)?.ready);
  }

  function startDrag(e, side, peek) {
    const target = spread + side;
    if (target < 0 || target > lastSpread() || !hasImages(target) || large) return false;
    open(target, cornerOf(e));
    session.peek = peek;
    session.hovered = peek;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(tick);
    return true;
  }

  root.addEventListener('pointerdown', (e) => {
    if (e.button || !e.isPrimary) return;
    press = { x: e.clientX, y: e.clientY, side: pointerSide(e), dragging: false, moved: false, id: e.pointerId };
    if (spread + press.side >= 0 && spread + press.side <= lastSpread()) quietly(prepare(spread + press.side));
    if (session?.peek) {
      session.peek = false;
      session.hovered = false;
      press.dragging = true;
      root.setPointerCapture(e.pointerId);
    }
  });

  root.addEventListener('pointermove', (e) => {
    if (press && e.pointerId === press.id) {
      const dx = e.clientX - press.x;
      const dy = e.clientY - press.y;
      if (Math.hypot(dx, dy) >= 8) press.moved = true;
      if (!press.dragging) {
        if (!press.moved) return;
        if (e.pointerType === 'touch' && Math.abs(dy) > Math.abs(dx)) {
          press = null;
          return;
        }
        if (session?.auto) return;
        if (!session && !startDrag(e, press.side, false)) return;
        press.dragging = true;
        root.setPointerCapture(e.pointerId);
      }
      if (session && !session.auto) {
        const { h } = measure();
        const aim = pointerPoint(e, session.dir);
        session.aim = { x: aim.x, y: Math.min(h + 16, Math.max(-16, aim.y)) };
      }
      return;
    }
    if (e.pointerType !== 'mouse' || large || session?.auto) return;
    /* Угол листа приподнимается, когда мышь рядом с ним */
    const { spine, top, w, h } = measure();
    const left = wide.matches ? spine - w : spine;
    const zone = peekZone();
    const side = e.clientX > spine + w - zone ? 1 : e.clientX < left + zone ? -1 : 0;
    const y = e.clientY - top;
    const near = side && (y < zone || y > h - zone);
    if (session?.peek) {
      if (near && session.dir === (wide.matches ? side : 1)) {
        session.hovered = true;
        session.aim = peekAim(e);
      } else {
        session.hovered = false;
        session.aim = { ...session.home };
      }
    } else if (near && !session && (side > 0 || wide.matches)) {
      if (startDrag(e, side, true)) session.aim = peekAim(e);
      else quietly(prepare(spread + side));
    }
  });

  root.addEventListener('pointerleave', () => {
    if (session?.peek) {
      session.hovered = false;
      session.aim = { ...session.home };
    }
  });

  const release = (e) => {
    if (!press || e.pointerId !== press.id) return;
    const { dragging, moved, side } = press;
    press = null;
    if (!moved) {
      /* Нажатие без движения переворачивает лист, уже приподнятый угол просто доводится */
      if (session?.peek || (dragging && session && !session.auto)) play(e.type === 'pointerup');
      else if (e.type === 'pointerup' && !large) turnTo(spread + side);
      return;
    }
    if (!dragging || !session || session.auto) return;
    const { w } = measure();
    const x = session.point.x;
    const passed = session.reversed ? x > w * 0.1 : x < (wide.matches ? 0 : w * 0.45);
    play(e.type === 'pointerup' && passed);
  };
  root.addEventListener('pointerup', release);
  root.addEventListener('pointercancel', release);

  function rebuild() {
    const page = firstPage(spread);
    if (session) stopSession();
    spread = spreadOf(page);
    root.classList.toggle('flip-single', !wide.matches);
    rest(spread);
    onChange(firstPage(spread), pagesOf(spread));
  }
  screen.addEventListener('change', rebuild, { signal });
  signal.addEventListener('abort', () => {
    request += 1;
    stopSession();
    canvas.remove();
  });

  root.classList.toggle('flip-single', !wide.matches);
  spread = spreadOf(start);
  rest(spread);
  loadSpread(spread).catch(() => onError(() => rest(spread)));

  return {
    go: (page) => turnTo(spreadOf(page)),
    next: () => turnTo((goal ?? spread) + 1),
    previous: () => turnTo((goal ?? spread) - 1),
    atStart: () => spread === 0,
    atEnd: () => spread === lastSpread(),
    isSpread: () => wide.matches,
    pages: () => pagesOf(spread),
    setLarge: (on) => { large = on; },
  };
}
