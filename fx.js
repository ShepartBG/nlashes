// Визуални ефекти: WebGL копринен фон, блестящ курсор със следа, перли при скрол, 3D око.
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
const mobile = () => innerWidth < 860;

const pointer = { x: innerWidth / 2, y: innerHeight / 2, active: 0, moved: false };
addEventListener("pointermove", e => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.moved = true; }, { passive: true });
addEventListener("pointerdown", e => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.moved = true; }, { passive: true });

/* ------------------------------------------------------------------
 * 1. WebGL фон — течащ сатен в бежово и розово, реагира на мишката
 * ---------------------------------------------------------------- */
function silk() {
  const canvas = document.getElementById("silk");
  const gl = canvas && canvas.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: "low-power" });
  if (!gl) return;

  const vs = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
  const fs = `
    precision mediump float;
    uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uHover; uniform float uScroll;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
    }
    float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; } return v; }
    void main(){
      vec2 uv = gl_FragCoord.xy / uRes;
      float asp = uRes.x / uRes.y;
      vec2 p = vec2(uv.x * asp, uv.y) * 1.15;
      p.y -= uScroll * 0.35;
      vec2 m = vec2(uMouse.x * asp, uMouse.y) * 1.15; m.y -= uScroll * 0.35;
      float d = distance(p, m);
      // нежна вълна около курсора
      p += (p - m) / (d + 0.001) * 0.035 * exp(-d * 2.6) * sin(d * 16.0 - uTime * 2.4) * uHover;
      float t = uTime * 0.045;
      vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
      vec2 r = vec2(fbm(p + 1.9 * q + vec2(1.7, 9.2) + t * 1.4), fbm(p + 1.9 * q + vec2(8.3, 2.8) - t));
      float f = fbm(p + 1.6 * r);
      float folds = sin((p.x * 0.9 + p.y * 1.25 + f * 3.6) * 3.14159);
      vec3 cream = vec3(0.935, 0.880, 0.830);
      vec3 sand  = vec3(0.885, 0.795, 0.725);
      vec3 blush = vec3(0.915, 0.770, 0.760);
      vec3 rose  = vec3(0.820, 0.600, 0.615);
      vec3 gold  = vec3(0.860, 0.735, 0.590);
      vec3 cocoa = vec3(0.600, 0.430, 0.410);
      vec3 col = mix(cream, sand, smoothstep(0.3, 0.7, fbm(p * 0.7 - t)));
      col = mix(col, blush, smoothstep(0.35, 0.8, f) * 0.85);
      col = mix(col, rose, smoothstep(0.65, 1.1, length(q)) * 0.32);
      col = mix(col, gold, smoothstep(0.55, 0.85, r.x) * 0.28);
      col = mix(col, cocoa, smoothstep(-0.2, -1.0, folds) * 0.12);
      col += smoothstep(0.7, 1.0, folds) * vec3(1.0, 0.96, 0.93) * 0.08;
      col += vec3(1.0, 0.92, 0.91) * exp(-d * d * 5.0) * 0.16 * uHover;
      col *= mix(0.9, 1.0, smoothstep(1.25, 0.3, length(uv - 0.5)));
      gl_FragColor = vec4(col, 1.0);
    }`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(prog, n);
  const uRes = U("uRes"), uTime = U("uTime"), uMouse = U("uMouse"), uHover = U("uHover"), uScroll = U("uScroll");

  let scale = 1, w = 0, h = 0;
  function resize() {
    scale = mobile() ? .33 : .5;
    w = Math.max(1, Math.round(innerWidth * scale));
    h = Math.max(1, Math.round(innerHeight * scale));
    canvas.width = w; canvas.height = h;
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uRes, w, h);
  }
  resize();
  addEventListener("resize", resize, { passive: true });

  const mouse = { x: .5, y: .5 }; let hover = 0, last = 0, raf = 0;
  const start = performance.now();
  function draw(now) {
    raf = 0;
    if (mobile() && now - last < 33) return loop(); // ~30 fps на телефон
    last = now;
    const tx = pointer.x / innerWidth, ty = 1 - pointer.y / innerHeight;
    mouse.x += (tx - mouse.x) * .06; mouse.y += (ty - mouse.y) * .06;
    hover += ((pointer.moved ? 1 : 0) - hover) * .03;
    pointer.moved = false;
    gl.uniform1f(uTime, (now - start) / 1000);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.uniform1f(uHover, Math.min(1, hover * 4));
    gl.uniform1f(uScroll, scrollY / innerHeight);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    loop();
  }
  function loop() { if (!raf && !document.hidden && !reduced) raf = requestAnimationFrame(draw); }
  document.addEventListener("visibilitychange", loop);
  document.documentElement.classList.add("has-silk");
  if (reduced) draw(performance.now()); else loop();
}

/* ------------------------------------------------------------------
 * 2. Блестящ курсор със следа + перли и блясък при скрол
 * ---------------------------------------------------------------- */
function sparkles() {
  const canvas = document.getElementById("sparkle");
  if (!canvas || reduced) return;
  const ctx = canvas.getContext("2d");
  let dpr = 1;
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  addEventListener("resize", resize, { passive: true });

  // Предварително нарисувани спрайтове: перла и искрица
  function sprite(size, fn) { const c = document.createElement("canvas"); c.width = c.height = size; fn(c.getContext("2d"), size); return c; }
  const pearl = sprite(64, (g, s) => {
    const r = s / 2;
    let gr = g.createRadialGradient(r * .7, r * .65, 1, r, r, r);
    gr.addColorStop(0, "#ffffff"); gr.addColorStop(.35, "#fbefea"); gr.addColorStop(.75, "#ecd2cd"); gr.addColorStop(1, "rgba(214,170,168,0)");
    g.fillStyle = gr; g.beginPath(); g.arc(r, r, r * .92, 0, 7); g.fill();
    gr = g.createLinearGradient(0, 0, s, s);
    gr.addColorStop(0, "rgba(255,220,235,.35)"); gr.addColorStop(.5, "rgba(210,235,255,.25)"); gr.addColorStop(1, "rgba(255,235,200,.35)");
    g.fillStyle = gr; g.beginPath(); g.arc(r, r, r * .9, 0, 7); g.fill();
    g.fillStyle = "rgba(255,255,255,.95)"; g.beginPath(); g.ellipse(r * .7, r * .62, r * .2, r * .13, -.6, 0, 7); g.fill();
  });
  const star = color => sprite(48, (g, s) => {
    const r = s / 2;
    const gr = g.createRadialGradient(r, r, 0, r, r, r * .55);
    gr.addColorStop(0, color.replace("A", ".9")); gr.addColorStop(1, color.replace("A", "0"));
    g.fillStyle = gr; g.beginPath(); g.arc(r, r, r * .55, 0, 7); g.fill();
    g.fillStyle = "#fff";
    g.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      g.lineTo(r + Math.cos(a) * r, r + Math.sin(a) * r);
      g.lineTo(r + Math.cos(a + Math.PI / 4) * r * .16, r + Math.sin(a + Math.PI / 4) * r * .16);
    }
    g.closePath(); g.fill();
  });
  const stars = ["rgba(255,214,190,A)", "rgba(244,190,200,A)", "rgba(255,240,220,A)", "rgba(226,195,166,A)"].map(star);

  const parts = [];
  const MAX = mobile() ? 70 : 160;
  function add(p) { if (parts.length < MAX) parts.push(p); }
  function spark(x, y, spread = 6) {
    add({ x: x + (Math.random() - .5) * spread, y: y + (Math.random() - .5) * spread, vx: (Math.random() - .5) * .6, vy: Math.random() * .5 + .1,
      s: 6 + Math.random() * 10, life: 0, max: 600 + Math.random() * 500, rot: Math.random() * 3, vr: (Math.random() - .5) * .08,
      img: stars[(Math.random() * stars.length) | 0] });
  }

  // Курсор: перлена точка + пръстен, който следва с лек закъснение
  const dot = document.querySelector(".cursor-dot"), ring = document.querySelector(".cursor-ring");
  const ringPos = { x: pointer.x, y: pointer.y };
  let lastX = null, lastY = null;
  if (finePointer && dot && ring) {
    document.documentElement.classList.add("has-cursor");
    addEventListener("pointermove", e => {
      dot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      if (lastX !== null) {
        const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
        for (let i = 0; i < Math.min(4, dist / 14); i++) spark(lerp(lastX, e.clientX, Math.random()), lerp(lastY, e.clientY, Math.random()));
      }
      lastX = e.clientX; lastY = e.clientY;
      document.documentElement.classList.remove("cursor-hidden");
      loop();
    }, { passive: true });
    document.addEventListener("pointerleave", () => document.documentElement.classList.add("cursor-hidden"));
    document.addEventListener("pointerover", e => ring.classList.toggle("is-link", !!e.target.closest("a, button, summary, input, .gallery__item")));
    addEventListener("pointerdown", () => { ring.classList.add("is-down"); for (let i = 0; i < 10; i++) spark(pointer.x, pointer.y, 30); loop(); });
    addEventListener("pointerup", () => ring.classList.remove("is-down"));
  }

  // Перли и блясък при скрол
  let lastScroll = scrollY;
  addEventListener("scroll", () => {
    const dy = scrollY - lastScroll;
    lastScroll = scrollY;
    const n = Math.min(mobile() ? 2 : 4, Math.abs(dy) / 45);
    for (let i = 0; i < n; i++) {
      const side = Math.random() < .5 ? Math.random() * innerWidth * .22 : innerWidth * (.78 + Math.random() * .22);
      const fromBottom = dy > 0;
      const isPearl = Math.random() < .55;
      add({ x: side, y: fromBottom ? innerHeight + 20 : -20, vx: (Math.random() - .5) * .4, vy: (fromBottom ? -1 : 1) * (.8 + Math.random() * 1.4),
        s: isPearl ? 7 + Math.random() * 12 : 8 + Math.random() * 10, life: 0, max: 1800 + Math.random() * 1400, rot: 0, vr: isPearl ? 0 : .04,
        img: isPearl ? pearl : stars[(Math.random() * stars.length) | 0], pearl: isPearl, ph: Math.random() * 6 });
    }
    if (n >= 1) loop();
  }, { passive: true });

  let raf = 0, prev = 0;
  function frame(now) {
    raf = 0;
    const dt = Math.min(48, now - (prev || now)); prev = now;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    if (ring && finePointer) {
      ringPos.x += (pointer.x - ringPos.x) * .2; ringPos.y += (pointer.y - ringPos.y) * .2;
      ring.style.transform = `translate3d(${ringPos.x.toFixed(1)}px, ${ringPos.y.toFixed(1)}px, 0)`;
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life += dt;
      if (p.life > p.max) { parts.splice(i, 1); continue; }
      const k = p.life / p.max;
      if (p.pearl) { p.ph += .03; p.x += Math.sin(p.ph) * .35; }
      p.x += p.vx * dt / 16; p.y += p.vy * dt / 16; p.rot += p.vr;
      const a = k < .15 ? k / .15 : 1 - (k - .15) / .85;
      const s = p.s * (p.pearl ? 1 : (1 - k * .6));
      ctx.globalAlpha = Math.max(0, a) * (p.pearl ? .85 : 1);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.drawImage(p.img, -s / 2, -s / 2, s, s);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    const ringMoving = finePointer && Math.hypot(pointer.x - ringPos.x, pointer.y - ringPos.y) > .3;
    if (parts.length || ringMoving) loop(); else prev = 0;
  }
  function loop() { if (!raf) raf = requestAnimationFrame(frame); }
}
const lerp = (a, b, t) => a + (b - a) * t;

/* ------------------------------------------------------------------
 * 3. 3D око в началото (three.js) — зарежда се отделно
 * ---------------------------------------------------------------- */
function eye3d() {
  const host = document.querySelector(".hero__eye");
  if (!host) return;
  const test = document.createElement("canvas");
  if (!(test.getContext("webgl2") || test.getContext("webgl"))) return;
  import("./eye3d.js").then(m => m.init(host, { reduced, finePointer, pointer })).catch(err => console.warn("3D eye unavailable", err));
}

silk();
sparkles();
eye3d();
