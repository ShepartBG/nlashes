(() => {
  "use strict";

  const BOOK = "https://www.beautyflow.bg/salon/nlashes";
  const reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = reduceMQ.matches;
  const isMobile = () => window.innerWidth < 860;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------------------------------------------------------------
   * Екран за зареждане — мигащото око изчезва след едно мигане
   * ------------------------------------------------------------- */
  const loader = $("#loader");
  let loaderDone = false;
  function hideLoader() {
    if (loaderDone || !loader) return;
    loaderDone = true;
    const wait = Math.max(0, (reduced ? 0 : 1900) - performance.now());
    setTimeout(() => {
      loader.classList.add("is-done");
      writeHero();
      setTimeout(() => loader.remove(), 900);
    }, wait);
  }
  if (document.readyState === "complete") hideLoader();
  else window.addEventListener("load", hideLoader);
  setTimeout(hideLoader, 4000);

  /* ---------------------------------------------------------------
   * Данни (от BeautyFlow, салон "nlashes")
   * ------------------------------------------------------------- */
  const SERVICES = [
    { id: "classic", name: "Косъм по косъм", min: 120, price: 35, img: "classic", badge: "Естествено",
      text: "Класическа техника — по една изкуствена мигла върху всяка естествена. Подчертан, но напълно естествен поглед." },
    { id: "2d", name: "Мигли 2D", min: 120, price: 35, img: "2d", badge: "Нежен обем",
      text: "Две фини мигли във ветрило върху всяка естествена — повече плътност и мекота, без да натоварват." },
    { id: "volume", name: "4D / 5D / Руски обем", min: 120, price: 40, img: "volume", badge: "Плътен поглед",
      text: "Ръчно изработени пухкави ветрила за наситен, плътен и бляскав ефект." },
    { id: "angel", name: "Ефект Ангелски очи", min: 120, price: 45, img: "angel", badge: "Тренд",
      text: "Обем с изразени „шипчета“ — отворен, кукленски поглед с красива текстура." },
    { id: "wispy", name: "Wispy Set", min: 120, price: 45, img: "wispy", badge: "Текстура",
      text: "Модерен сет с различни дължини и шипове — пухкав, въздушен, с ефект на перо." },
    { id: "maint", name: "Поддръжка до 3-та седмица", min: 60, price: 30, img: "maint", badge: "Поддръжка",
      text: "Попълване на изпадналите мигли и освежаване на сета, за да е отново пълен." },
    { id: "maint2", name: "Поддръжка на Angel, Wispy или Hybrid до 3-та седмица", min: 80, price: 40, img: "maint2", badge: "Поддръжка",
      text: "Поддръжка за текстурираните стилове — попълване и оформяне на шипчетата." }
  ];

  // weekday: 0 = неделя (както в BeautyFlow)
  const HOURS = [
    { d: 1, name: "Понеделник", h: "10:00 – 19:30" },
    { d: 2, name: "Вторник", h: "10:00 – 19:30" },
    { d: 3, name: "Сряда", h: "10:00 – 19:30" },
    { d: 4, name: "Четвъртък", h: "10:00 – 19:30" },
    { d: 5, name: "Петък", h: "10:00 – 19:30" },
    { d: 6, name: "Събота", h: null },
    { d: 0, name: "Неделя", h: null }
  ];

  // Реални отзиви от клиентки — добавете тук, и секцията ще ги покаже автоматично.
  // Пример: { name: "Мария", text: "Невероятни мигли!", stars: 5 }
  const REVIEWS = [];

  const STYLES = [
    { id: "classic", name: "Косъм по косъм", en: "Classic", dens: 25, drama: 20,
      text: "По една мигла върху всяка естествена. Удължава и подчертава, като запазва естествения вид.",
      fit: "ежедневие, първи сет, гъсти естествени мигли",
      art: { n: 34, fan: 1, len: t => 20 + 16 * t, w: 1.5 } },
    { id: "2d", name: "2D", en: "Light volume", dens: 45, drama: 40,
      text: "Ветрило от две ултрафини мигли. По-плътна линия, мек и „поддържан“ ефект без тежест.",
      fit: "естествен, но по-изразен поглед",
      art: { n: 34, fan: 2, spread: .16, len: t => 22 + 18 * t, w: 1.2 } },
    { id: "volume", name: "Руски обем 4D/5D", en: "Russian volume", dens: 90, drama: 85,
      text: "Пухкави ветрила от 4–5 мигли за плътна, тъмна линия и бляскав, „гримиран“ поглед.",
      fit: "любителки на ефектната визия, редки мигли",
      art: { n: 40, fan: 5, spread: .42, len: t => 24 + 20 * t, w: .9 } },
    { id: "angel", name: "Ангелски очи", en: "Angel eyes", dens: 70, drama: 70,
      text: "Обем с равномерно разположени по-дълги „шипчета“. Окото изглежда отворено и кукленско.",
      fit: "кръгли и „отворени“ очи, модерен вид",
      art: { n: 38, fan: 3, spread: .3, len: (t, i) => (i % 4 === 0 ? 1.75 : .9) * (20 + 14 * t), w: (t, i) => (i % 4 === 0 ? 1.6 : .9) } },
    { id: "wet", name: "Мокър ефект", en: "Wet look", dens: 55, drama: 65,
      text: "Миглите се събират в остри, лъскави снопчета — като току-що излязла от водата.",
      fit: "смел, свеж и модерен вид",
      art: { n: 30, fan: 4, spread: .02, len: (t, i) => (i % 2 ? .85 : 1.1) * (24 + 18 * t), w: 1.1 } },
    { id: "hybrid", name: "Хибрид", en: "Hybrid", dens: 60, drama: 55,
      text: "Комбинация от класика и обемни ветрила. Текстура и плътност в баланс.",
      fit: "искаш повече от класика, но не пълен обем",
      art: { n: 36, fan: i => (i % 2 ? 3 : 1), spread: .3, len: t => 22 + 18 * t, w: 1.15 } },
    { id: "wispy", name: "Wispy", en: "Wispy set", dens: 75, drama: 80,
      text: "Различни дължини и изразени шипове върху пухкава основа — въздушен, „перест“ ефект.",
      fit: "бадемовидни очи, текстуриран поглед",
      art: { n: 40, fan: 3, spread: .34, len: (t, i) => (i % 3 === 0 ? 1.85 - .3 * Math.sin(i) : .72) * (20 + 16 * t), w: (t, i) => (i % 3 === 0 ? 1.5 : .85) } }
  ];

  const QUIZ = [
    { q: "Какъв ефект търсиш?", a: [
      ["Естествен — като моите, но по-хубави", { classic: 3, "2d": 1 }],
      ["Нежно подчертан, „поддържан“ поглед", { "2d": 3, angel: 1 }],
      ["Плътен, тъмен и бляскав", { volume: 3, wispy: 1 }],
      ["Текстуриран и модерен", { wispy: 2, angel: 2 }]] },
    { q: "Какви са естествените ти мигли?", a: [
      ["Гъсти и здрави", { classic: 2, volume: 1 }],
      ["Средно гъсти", { "2d": 1, angel: 1, wispy: 1 }],
      ["Редки или тънки", { volume: 2, "2d": 1 }],
      ["Не съм сигурна", { "2d": 1 }]] },
    { q: "Колко грим носиш обикновено?", a: [
      ["Почти никакъв", { classic: 2, "2d": 1 }],
      ["Лек, ежедневен", { "2d": 2, angel: 1 }],
      ["Обичам изразителен грим", { volume: 2, wispy: 1 }],
      ["Зависи от настроението", { angel: 1, wispy: 1 }]] },
    { q: "Какъв поглед мечтаеш да имаш?", a: [
      ["Отворен, кукленски", { angel: 3 }],
      ["Удължен, леко котешки", { wispy: 2, volume: 1 }],
      ["Просто по-изразителен", { classic: 1, "2d": 2 }],
      ["Довери се на Нина", { "2d": 1, angel: 1 }]] }
  ];

  const RESULTS = {
    classic: "Косъм по косъм е твоят избор — изчистен, естествен и елегантен поглед, който подчертава собствените ти мигли.",
    "2d": "2D обемът ще ти стои чудесно — мек, лек и „поддържан“ ефект, с който изглеждаш красиво без усилие всеки ден.",
    volume: "Руският обем е за теб — наситена, плътна линия и бляскав поглед, който не остава незабелязан.",
    angel: "Ангелски очи — шипчетата ще отворят погледа ти и ще му придадат модерен, кукленски чар.",
    wispy: "Wispy сет — въздушна текстура с различни дължини за смел, модерен и изразителен поглед."
  };

  /* ---------------------------------------------------------------
   * Геометрия на окото и миглите
   * ------------------------------------------------------------- */
  const bez = (p0, p1, p2, p3, t) => {
    const u = 1 - t;
    return [
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]
    ];
  };
  const dbez = (p0, p1, p2, p3, t) => {
    const u = 1 - t;
    return [
      3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]),
      3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1])
    ];
  };
  const norm = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
  const rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
  const lerp = (a, b, t) => a + (b - a) * t;
  const lp = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
  const f1 = n => Math.round(n * 10) / 10;
  const cubicD = c => `M${c[0]}C${c[1]} ${c[2]} ${c[3]}`;
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  // Една мигла като тънка извита форма, която изтънява към върха
  function lashShape(base, dir, len, w) {
    const tipDir = rot(dir, .22);
    const tip = [base[0] + tipDir[0] * len, base[1] + tipDir[1] * len];
    const c = [base[0] + dir[0] * len * .6, base[1] + dir[1] * len * .6];
    const s = [-dir[1], dir[0]];
    return `M${f1(base[0] + s[0] * w)} ${f1(base[1] + s[1] * w)}Q${f1(c[0] + s[0] * w * .45)} ${f1(c[1] + s[1] * w * .45)} ${f1(tip[0])} ${f1(tip[1])}Q${f1(c[0] - s[0] * w * .45)} ${f1(c[1] - s[1] * w * .45)} ${f1(base[0] - s[0] * w)} ${f1(base[1] - s[1] * w)}Z`;
  }

  // Мигли по крива: o = { n, t0, t1, fan, spread, len, w, blink, down, seed, lenScale }
  function lashesD(curve, o) {
    const r = rng(o.seed || 7);
    const n = o.n, blink = o.blink || 0;
    let d = "";
    for (let i = 0; i < n; i++) {
      const t = lerp(o.t0 ?? .05, o.t1 ?? .98, i / (n - 1));
      const base = bez(...curve, t);
      const tan = norm(dbez(...curve, t));
      let dir = o.down ? [-tan[1], tan[0]] : [tan[1], -tan[0]];
      dir = rot(dir, (o.down ? -1 : 1) * (t - .42) * (o.down ? .7 : 1.05));
      if (blink) dir = norm(lp(dir, norm([.5 * (t - .3), 1]), blink));
      const fan = typeof o.fan === "function" ? o.fan(i) : (o.fan || 1);
      const spread = o.spread || 0;
      const L = o.len(t, i) * (1 - .3 * blink) * (o.lenScale || 1);
      for (let k = 0; k < fan; k++) {
        const off = fan > 1 ? (k / (fan - 1) - .5) * spread : 0;
        const jitter = (r() - .5) * .07;
        d += lashShape(base, rot(dir, off + jitter), L * (.9 + r() * .18), typeof o.w === "function" ? o.w(t, i) : o.w);
      }
    }
    return d;
  }

  const A = [70, 165], B = [335, 150];
  const UP_OPEN = [A, [135, 60], [275, 55], B];
  const LOW = [A, [145, 225], [270, 220], B];
  const UP_CLOSED = [A, [146, 221], [270, 216], B];
  const lowerLashOpts = { n: 20, t0: .2, t1: .92, fan: 1, len: t => 6 + 7 * t, w: .7, down: true, seed: 3 };

  const upperAt = p => UP_OPEN.map((pt, i) => lp(pt, UP_CLOSED[i], p));
  const eyeShape = up => `M${A}C${up[1]} ${up[2]} ${B}C${LOW[2]} ${LOW[1]} ${A}Z`;
  const reverseCubic = c => `L${c[3]}C${c[2]} ${c[1]} ${c[0]}`;

  /* ---------------------------------------------------------------
   * Анимирано око (hero)
   * ------------------------------------------------------------- */
  const heroEye = $(".eye");
  const heroLash = { n: 44, t0: .04, t1: .99, fan: 2, spread: .14, len: t => 22 + 36 * Math.pow(t, 1.35), w: 1.35, seed: 11 };
  const el = {
    clip: $(".eye__clip"), white: $(".eye__white"), lid: $(".eye__lid"), lashes: $(".eye__lashes"),
    crease: $(".eye__crease"), shade: $(".eye__shade"), iris: $(".eye__iris"),
    lower: $(".eye__lower"), low: $(".eye__lowlashes"), fibres: $(".eye__fibres")
  };
  const lashPathHero = document.createElementNS("http://www.w3.org/2000/svg", "path");
  el.lashes.appendChild(lashPathHero);

  function drawHero(p) {
    const up = upperAt(p);
    const shape = eyeShape(up);
    el.clip.setAttribute("d", shape);
    el.white.setAttribute("d", shape);
    el.lid.setAttribute("d", cubicD(up));
    const sh = up.map((pt, i) => (i === 0 || i === 3 ? pt : [pt[0], pt[1] + 16]));
    el.shade.setAttribute("d", cubicD(up) + reverseCubic(sh) + "Z");
    const cr = [[82, 150], lp([140, 38], [146, 150], p * .7), lp([272, 32], [270, 146], p * .7), [326, 134]];
    el.crease.setAttribute("d", cubicD(cr));
    lashPathHero.setAttribute("d", lashesD(up, { ...heroLash, blink: p }));
  }

  function initHeroStatic() {
    el.lower.setAttribute("d", cubicD(LOW));
    const lp2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
    lp2.setAttribute("d", lashesD(LOW, lowerLashOpts));
    el.low.appendChild(lp2);
    let f = "";
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      const r1 = 22 + (i % 3) * 2, r2 = 44 + (i % 2) * 4;
      f += `M${f1(200 + Math.cos(a) * r1)} ${f1(158 + Math.sin(a) * r1)}L${f1(200 + Math.cos(a) * r2)} ${f1(158 + Math.sin(a) * r2)}`;
    }
    const fp = document.createElementNS("http://www.w3.org/2000/svg", "path");
    fp.setAttribute("d", f);
    el.fibres.appendChild(fp);
    drawHero(0);
  }
  initHeroStatic();

  // Мигане
  let heroVisible = true, blinkTimer = 0, blinking = false;
  const easeIn = t => t * t, easeOut = t => 1 - (1 - t) * (1 - t);
  function animate(from, to, ms, ease) {
    return new Promise(res => {
      const s = performance.now();
      const step = now => {
        const k = Math.min(1, (now - s) / ms);
        drawHero(lerp(from, to, ease(k)));
        k < 1 ? requestAnimationFrame(step) : res();
      };
      requestAnimationFrame(step);
    });
  }
  const wait = ms => new Promise(r => setTimeout(r, ms));
  async function blink() {
    if (blinking || reduced || !heroVisible || document.hidden) return scheduleBlink();
    blinking = true;
    await animate(0, 1, 300, easeIn);
    await wait(90);
    await animate(1, 0, 480, easeOut);
    if (Math.random() < .2) { await wait(160); await animate(0, 1, 240, easeIn); await wait(60); await animate(1, 0, 420, easeOut); }
    blinking = false;
    scheduleBlink();
  }
  function scheduleBlink() { clearTimeout(blinkTimer); blinkTimer = setTimeout(blink, 3200 + Math.random() * 3300); }

  // Леко движение на ириса
  let gaze = [0, 0], gazeTarget = [0, 0], gazeRaf = 0;
  function gazeTick() {
    gaze = lp(gaze, gazeTarget, .08);
    el.iris.setAttribute("transform", `translate(${f1(gaze[0])} ${f1(gaze[1])})`);
    gazeRaf = Math.hypot(gaze[0] - gazeTarget[0], gaze[1] - gazeTarget[1]) > .05 ? requestAnimationFrame(gazeTick) : 0;
  }
  function lookAt(x, y) { gazeTarget = [x, y]; if (!gazeRaf) gazeRaf = requestAnimationFrame(gazeTick); }
  function wander() {
    if (!reduced && heroVisible && !document.hidden) lookAt((Math.random() - .5) * 18, (Math.random() - .5) * 8);
    setTimeout(wander, 2600 + Math.random() * 2600);
  }
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    window.addEventListener("pointermove", e => {
      if (reduced || !heroVisible) return;
      const r = heroEye.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
      const dy = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
      lookAt(Math.max(-1, Math.min(1, dx * 2.2)) * 14, Math.max(-1, Math.min(1, dy * 2.2)) * 7);
    }, { passive: true });
  }

  /* ---------------------------------------------------------------
   * Статични очи (преди/след) и илюстрации на стиловете
   * ------------------------------------------------------------- */
  function staticEye(svg, lashOpts, lashColor) {
    const up = UP_OPEN;
    const shape = eyeShape(up);
    const id = "clip-" + Math.random().toString(36).slice(2, 8);
    const sh = up.map((pt, i) => (i === 0 || i === 3 ? pt : [pt[0], pt[1] + 16]));
    svg.innerHTML = `
      <defs><clipPath id="${id}"><path d="${shape}"/></clipPath></defs>
      <path d="M82 150C140 38 272 32 326 134" fill="none" stroke="#caaaaf" stroke-width="1.4" opacity=".6"/>
      <path d="${shape}" fill="url(#scleraG)"/>
      <g clip-path="url(#${id})">
        <circle cx="200" cy="158" r="50" fill="url(#irisG)"/>
        <circle cx="200" cy="158" r="20" fill="#1b1819"/>
        <circle cx="214" cy="143" r="8" fill="#fff" fill-opacity=".9"/>
        <path d="${cubicD(up) + reverseCubic(sh)}Z" fill="#99747a" fill-opacity=".1"/>
      </g>
      <path d="${cubicD(LOW)}" fill="none" stroke="#433336" stroke-width="1.2" opacity=".5"/>
      <path d="${lashesD(LOW, lowerLashOpts)}" fill="#433336" opacity=".5"/>
      <path d="${cubicD(up)}" fill="none" stroke="#271e1f" stroke-width="${lashOpts.lid || 3}" stroke-linecap="round"/>
      <path d="${lashesD(up, lashOpts)}" fill="${lashColor}"/>`;
  }
  const before = $('[data-eye="before"]');
  const after = $('[data-eye="after"]');
  if (before) staticEye(before, { n: 30, t0: .08, t1: .97, fan: 1, len: t => 12 + 10 * t, w: .85, seed: 5, lid: 1.6 }, "#595355");
  if (after) staticEye(after, { n: 46, t0: .04, t1: .99, fan: 4, spread: .34, len: t => 26 + 36 * Math.pow(t, 1.3), w: 1, seed: 9, lid: 3.4 }, "#1b1819");

  const STRIP = [[24, 112], [120, 28], [282, 24], [378, 104]];
  function stripSVG(art) {
    const opts = { t0: .03, t1: .99, seed: 21, lenScale: 1.15, ...art };
    return `<svg viewBox="0 -20 400 150" aria-hidden="true">
      <path d="${cubicD(STRIP)}C300 140 110 146 24 112Z" fill="#e9d9dc" opacity=".55"/>
      <path d="${cubicD(STRIP)}" fill="none" stroke="#271e1f" stroke-width="2.6" stroke-linecap="round"/>
      <path d="${lashesD(STRIP, opts)}" fill="#271e1f"/></svg>`;
  }

  /* ---------------------------------------------------------------
   * Рендер на секциите
   * ------------------------------------------------------------- */
  const dur = m => (m >= 120 && m % 60 === 0 ? `${m / 60} ч.` : m > 60 ? `${Math.floor(m / 60)} ч. ${m % 60} мин` : `${m} мин`);
  const clockIc = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';

  const svcCard = (s, i) => `
    <article class="svc reveal" style="--d:${(i % 3) * .1}s">
      <div class="svc__img curtain"><img src="assets/services/${s.img}-sm.webp" alt="${s.name} — работа на N Lashes" loading="lazy" width="640" height="800"><span class="svc__badge">${s.badge}</span></div>
      <div class="svc__body">
        <h3>${s.name}</h3>
        <p>${s.text}</p>
        <div class="svc__meta"><span class="svc__price">${s.price} €</span><span class="svc__time">${clockIc}${dur(s.min)}</span></div>
        <a class="btn btn--primary" href="${BOOK}" target="_blank" rel="noopener">Запази час</a>
      </div>
    </article>`;
  $("#services-grid").innerHTML = SERVICES.filter(s => !s.id.startsWith("maint")).map(svcCard).join("");
  $("#maint-grid").innerHTML = SERVICES.filter(s => s.id.startsWith("maint")).map((s, i) => svcCard(s, i).replace("svc reveal", "svc svc--row reveal")).join("");

  $("#styles-grid").innerHTML = STYLES.map((s, i) => `
    <article class="style reveal" style="--d:${(i % 3) * .1}s">
      <div class="style__art">${stripSVG(s.art)}</div>
      <div class="style__head"><h3>${s.name}</h3><span class="style__en">${s.en}</span></div>
      <p>${s.text}</p>
      <div class="style__scale">
        <div><span>Плътност</span><i style="--v:${s.dens}%"></i></div>
        <div><span>Драма</span><i style="--v:${s.drama}%"></i></div>
      </div>
      <p class="style__for"><b>Подходящ за:</b> ${s.fit}</p>
    </article>`).join("");

  const GALLERY = Array.from({ length: 10 }, (_, i) => `assets/gallery/g${i + 1}`);
  $("#gallery-grid").innerHTML = GALLERY.map((g, i) => `
    <button class="gallery__item curtain reveal" style="--d:${(i % 4) * .08}s" data-i="${i}" aria-label="Отвори снимка ${i + 1}">
      <img src="${g}-sm.webp" alt="Сет мигли от N Lashes — снимка ${i + 1}" loading="lazy">
    </button>`).join("");

  $("#reviews-grid").innerHTML = REVIEWS.map(r => `
    <figure class="review reveal"><div class="review__stars" aria-label="${r.stars} от 5">${"★".repeat(r.stars)}</div>
    <p>„${r.text}“</p><cite>— ${r.name}</cite></figure>`).join("");

  const today = new Date().getDay();
  $("#hours-list").innerHTML = HOURS.map(h => `<li class="${h.h ? "" : "off"} ${h.d === today ? "today" : ""}"><span>${h.name}</span><span>${h.h || "почивен ден"}</span></li>`).join("");
  $("#year").textContent = new Date().getFullYear();

  // Орнамент „затворено око с мигли“ под всяко заглавие — рисува се при поява
  const ORN = (() => {
    const c = [[30, 10], [70, 34], [130, 34], [170, 10]];
    let l = "";
    for (let i = 0; i < 9; i++) {
      const t = .14 + i * .09, b = bez(...c, t), tan = norm(dbez(...c, t));
      const d = rot([-tan[1], tan[0]], (t - .5) * -1.1), L = 7 + 4 * Math.sin(t * Math.PI);
      l += `<path d="M${f1(b[0])} ${f1(b[1])}l${f1(d[0] * L)} ${f1(d[1] * L)}" pathLength="1" style="--i:${i}"/>`;
    }
    return `<svg class="ornament" viewBox="0 0 200 52" aria-hidden="true"><path class="ornament__lid" d="${cubicD(c)}" pathLength="1"/>${l}</svg>`;
  })();
  $$(".section__head h2").forEach(h => h.insertAdjacentHTML("afterend", ORN));

  /* ---------------------------------------------------------------
   * Тест „Кой стил ти отива?“
   * ------------------------------------------------------------- */
  const quizCard = $("#quiz-card");
  let answers = [];
  function renderQuiz() {
    const step = answers.length;
    if (step >= QUIZ.length) return renderResult();
    const q = QUIZ[step];
    quizCard.innerHTML = `
      <div class="quiz__anim">
        <div class="quiz__progress" aria-hidden="true">${QUIZ.map((_, i) => `<i class="${i <= step ? "on" : ""}"></i>`).join("")}</div>
        <p class="quiz__step">Въпрос ${step + 1} от ${QUIZ.length}</p>
        <p class="quiz__q" id="quiz-q">${q.q}</p>
        <div class="quiz__opts" role="group" aria-labelledby="quiz-q">
          ${q.a.map((a, i) => `<button class="quiz__opt" data-a="${i}"><b>${"абвг"[i]}</b><span>${a[0]}</span></button>`).join("")}
        </div>
        ${step ? '<button class="quiz__back">← Назад</button>' : ""}
      </div>`;
  }
  function renderResult() {
    const score = { classic: 0, "2d": .5, volume: 0, angel: 0, wispy: 0 };
    answers.forEach((a, i) => Object.entries(QUIZ[i].a[a][1]).forEach(([k, v]) => (score[k] += v)));
    const ranked = Object.entries(score).sort((a, b) => b[1] - a[1]);
    const best = SERVICES.find(s => s.id === ranked[0][0]);
    const alt = SERVICES.find(s => s.id === ranked[1][0]);
    quizCard.innerHTML = `
      <div class="quiz__anim quiz__result">
        <img src="assets/services/${best.img}-sm.webp" alt="${best.name}">
        <div>
          <p class="quiz__step">Твоят стил</p>
          <h3>${best.name}</h3>
          <p>${RESULTS[best.id]}</p>
          <div class="svc__meta"><span class="svc__price">${best.price} €</span><span class="svc__time">${clockIc}${dur(best.min)}</span></div>
          <p class="quiz__alt">Също ще ти отива: <strong>${alt.name}</strong>. На място ще уточним заедно дължината и извивката.</p>
          <div class="btn-row">
            <a class="btn btn--primary" href="${BOOK}" target="_blank" rel="noopener">Запази час</a>
            <button class="btn btn--ghost quiz__restart">Започни отначало</button>
          </div>
        </div>
      </div>`;
  }
  quizCard.addEventListener("click", e => {
    const opt = e.target.closest(".quiz__opt");
    if (opt) { answers.push(+opt.dataset.a); renderQuiz(); quizCard.querySelector("button")?.focus({ preventScroll: true }); return; }
    if (e.target.closest(".quiz__back")) { answers.pop(); renderQuiz(); return; }
    if (e.target.closest(".quiz__restart")) { answers = []; renderQuiz(); }
  });
  renderQuiz();

  /* ---------------------------------------------------------------
   * Преди / след слайдер
   * ------------------------------------------------------------- */
  const ba = $("#ba-slider");
  if (ba) {
    const range = $("input", ba);
    const set = v => ba.style.setProperty("--pos", v + "%");
    range.addEventListener("input", () => set(range.value));
    // Лек намек при първо появяване
    const hint = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      hint.disconnect();
      if (reduced) return;
      const s = performance.now();
      const step = now => {
        const k = Math.min(1, (now - s) / 1800);
        const v = 50 + Math.sin(k * Math.PI * 2) * 18 * (1 - k);
        set(v); range.value = v;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: .6 });
    hint.observe(ba);
  }

  /* ---------------------------------------------------------------
   * Галерия — лайтбокс
   * ------------------------------------------------------------- */
  const lb = $("#lightbox");
  const lbImg = $("img", lb);
  let lbI = 0;
  const showLb = i => {
    lbI = (i + GALLERY.length) % GALLERY.length;
    lbImg.src = GALLERY[lbI] + ".webp";
    lbImg.alt = `Сет мигли от N Lashes — снимка ${lbI + 1}`;
    $(".lightbox__count", lb).textContent = `${lbI + 1} / ${GALLERY.length}`;
  };
  $("#gallery-grid").addEventListener("click", e => {
    const b = e.target.closest(".gallery__item");
    if (!b) return;
    showLb(+b.dataset.i);
    lb.showModal();
  });
  $(".lightbox__close", lb).addEventListener("click", () => lb.close());
  $(".lightbox__prev", lb).addEventListener("click", () => showLb(lbI - 1));
  $(".lightbox__next", lb).addEventListener("click", () => showLb(lbI + 1));
  lb.addEventListener("click", e => { if (e.target === lb) lb.close(); });
  lb.addEventListener("keydown", e => { if (e.key === "ArrowLeft") showLb(lbI - 1); if (e.key === "ArrowRight") showLb(lbI + 1); });
  let sx = null;
  lb.addEventListener("pointerdown", e => (sx = e.clientX));
  lb.addEventListener("pointerup", e => { if (sx !== null && Math.abs(e.clientX - sx) > 50) showLb(lbI + (e.clientX < sx ? 1 : -1)); sx = null; });

  /* ---------------------------------------------------------------
   * Навигация
   * ------------------------------------------------------------- */
  const nav = $(".nav"), burger = $(".burger"), menu = $("#mobile-menu");
  burger.addEventListener("click", () => {
    const open = burger.getAttribute("aria-expanded") !== "true";
    burger.setAttribute("aria-expanded", open);
    menu.hidden = !open;
    nav.classList.toggle("is-scrolled", open || window.scrollY > 20);
  });
  menu.addEventListener("click", e => { if (e.target.closest("a")) { burger.setAttribute("aria-expanded", "false"); menu.hidden = true; } });

  /* ---------------------------------------------------------------
   * Появяване при скрол + броячи
   * ------------------------------------------------------------- */
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add("in");
    io.unobserve(en.target);
    $$("[data-count]", en.target).forEach(countUp);
  }), { threshold: .12, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal").forEach(n => io.observe(n));

  function countUp(n) {
    const end = +n.dataset.count;
    if (reduced) return;
    const s = performance.now();
    const step = now => {
      const k = Math.min(1, (now - s) / 1400);
      n.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------------------------------------------------------------
   * Калиграфия — думите се „изписват“ с перо при поява
   * ------------------------------------------------------------- */
  const heroCallig = $$(".hero .callig");
  function writeHero() { heroCallig.forEach(c => c.classList.add("write")); }
  if (!loader) writeHero();
  const pen = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add("write");
    pen.unobserve(en.target);
  }), { threshold: .6 });
  $$(".callig").filter(c => !c.closest(".hero")).forEach(c => pen.observe(c));

  /* ---------------------------------------------------------------
   * Скрол: рисуване на линиите, паралакс, навигация, бутон
   * ------------------------------------------------------------- */
  const flows = $$(".flow");
  const parallax = $$("[data-parallax]");
  const fab = $(".fab");
  const hero = $(".hero");
  const contact = $("#contact");
  let ticking = false;

  function onScroll() {
    ticking = false;
    const vh = window.innerHeight;
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 20 || burger.getAttribute("aria-expanded") === "true");
    const cr = contact.getBoundingClientRect();
    fab.classList.toggle("show", y > hero.offsetHeight * .8 && cr.top > vh * .6);
    if (reduced) return;
    for (const s of flows) {
      const r = s.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) continue;
      const k = Math.max(0, Math.min(1, (vh - r.top) / (r.height * .9 + vh * .2)));
      s.style.setProperty("--draw", (1 - k).toFixed(3));
    }
    const f = isMobile() ? .5 : 1;
    for (const n of parallax) {
      const r = n.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) continue;
      const off = (r.top + r.height / 2 - vh / 2) * -(+n.dataset.parallax) * f;
      n.style.transform = `translate3d(0, ${off.toFixed(1)}px, 0)`;
    }
  }
  const requestScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } };
  window.addEventListener("scroll", requestScroll, { passive: true });
  window.addEventListener("resize", requestScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------------
   * Частици в началото
   * ------------------------------------------------------------- */
  const canvas = $(".particles");
  const ctx = canvas.getContext("2d");
  let parts = [], cw = 0, ch = 0, dpr = 1, raf = 0, sprites = [];

  function makeSprite(color) {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, color.replace("A", "1"));
    grd.addColorStop(.35, color.replace("A", ".55"));
    grd.addColorStop(1, color.replace("A", "0"));
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    return c;
  }
  sprites = ["rgba(220, 192, 196,A)", "rgba(182, 146, 152,A)", "rgba(182, 172, 175,A)", "rgba(255, 255, 255,A)"].map(makeSprite);

  function sizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, isMobile() ? 1.5 : 2);
    cw = hero.clientWidth; ch = hero.clientHeight;
    canvas.width = cw * dpr; canvas.height = ch * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(isMobile() ? 22 : 48, (cw * ch) / 22000));
    parts = Array.from({ length: count }, () => spawn(true));
  }
  function spawn(anywhere) {
    const big = Math.random() < .18;
    return {
      x: Math.random() * cw,
      y: anywhere ? Math.random() * ch : ch + 20,
      s: big ? 14 + Math.random() * 18 : 4 + Math.random() * 8,
      vy: -(.12 + Math.random() * .28),
      ph: Math.random() * Math.PI * 2,
      sw: .2 + Math.random() * .5,
      a: big ? .18 + Math.random() * .2 : .35 + Math.random() * .45,
      sp: sprites[(Math.random() * sprites.length) | 0]
    };
  }
  let last = 0;
  function frame(now) {
    raf = 0;
    const dt = Math.min(50, now - (last || now)) / 16.67;
    last = now;
    ctx.clearRect(0, 0, cw, ch);
    for (const p of parts) {
      p.y += p.vy * dt;
      p.ph += .012 * dt;
      p.x += Math.sin(p.ph) * p.sw * .3 * dt;
      if (p.y < -30) Object.assign(p, spawn(false));
      const fade = Math.min(1, (ch - p.y) / 120, (p.y + 30) / 120);
      ctx.globalAlpha = p.a * Math.max(0, fade) * (.75 + .25 * Math.sin(p.ph * 2));
      ctx.drawImage(p.sp, p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
    }
    loop();
  }
  function loop() { if (!raf && heroVisible && !reduced && !document.hidden) raf = requestAnimationFrame(frame); }
  function stop() { cancelAnimationFrame(raf); raf = 0; last = 0; }

  new IntersectionObserver(([en]) => {
    heroVisible = en.isIntersecting;
    heroVisible ? loop() : stop();
  }).observe(hero);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : loop()));
  let rT;
  window.addEventListener("resize", () => { clearTimeout(rT); rT = setTimeout(() => { if (Math.abs(hero.clientWidth - cw) > 40 || Math.abs(hero.clientHeight - ch) > 120) sizeCanvas(); }, 200); });

  function startMotion() {
    if (reduced) { stop(); drawHero(0); el.iris.removeAttribute("transform"); return; }
    sizeCanvas(); loop(); scheduleBlink();
  }
  reduceMQ.addEventListener?.("change", e => { reduced = e.matches; startMotion(); onScroll(); });
  startMotion();
  wander();
})();
