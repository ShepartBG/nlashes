// 3D око с мигли: бисерна очна ябълка, клепачи в розово злато, перли в орбита.
// Мига, следи курсора и се върти с мишката. При грешка остава SVG окото.
import * as THREE from "three";
import { RoomEnvironment } from "./assets/vendor/RoomEnvironment.js";

const deg = d => d * Math.PI / 180;
const UPPER_OPEN = deg(-40), UPPER_CLOSED = deg(27), LOWER = deg(31);

// Ирис, нарисуван върху еквиректангуларна текстура (предната точка е u = .25)
function eyeTexture() {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 512;
  const g = c.getContext("2d");
  const bg = g.createLinearGradient(0, 0, 1024, 0);
  bg.addColorStop(0, "#e3dfe0"); bg.addColorStop(.25, "#fcfafb"); bg.addColorStop(.5, "#e3dfe0"); bg.addColorStop(1, "#e3dfe0");
  g.fillStyle = bg; g.fillRect(0, 0, 1024, 512);
  const cx = 256, cy = 256, R = 80;
  let gr = g.createRadialGradient(cx, cy, 10, cx, cy, R);
  gr.addColorStop(0, "#c08b66"); gr.addColorStop(.45, "#8a5539"); gr.addColorStop(.85, "#5a3324"); gr.addColorStop(1, "#2e1a12");
  g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
  for (let i = 0; i < 140; i++) {
    const a = Math.random() * Math.PI * 2, r1 = 30 + Math.random() * 10, r2 = 60 + Math.random() * 26;
    g.strokeStyle = `rgba(${Math.random() < .5 ? "255,226,196" : "60,30,20"},${.15 + Math.random() * .25})`;
    g.lineWidth = 1 + Math.random() * 1.5;
    g.beginPath(); g.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); g.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); g.stroke();
  }
  g.strokeStyle = "rgba(30,15,10,.55)"; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, R - 2, 0, 7); g.stroke();
  g.fillStyle = "#100a0b"; g.beginPath(); g.arc(cx, cy, 30, 0, 7); g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// Тънка мигла: тръба по крива, която изтънява към върха
function lashGeometry(curve, radius, seg = 14, radial = 5) {
  const geo = new THREE.TubeGeometry(curve, seg, radius, radial, false);
  const pos = geo.attributes.position;
  for (let i = 0; i <= seg; i++) {
    const c = curve.getPointAt(i / seg);
    const taper = 1 - (i / seg) * .88;
    for (let j = 0; j <= radial; j++) {
      const k = i * (radial + 1) + j;
      pos.setXYZ(k, c.x + (pos.getX(k) - c.x) * taper, c.y + (pos.getY(k) - c.y) * taper, c.z + (pos.getZ(k) - c.z) * taper);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

function merge(geos) {
  let vCount = 0, iCount = 0;
  geos.forEach(g => { vCount += g.attributes.position.count; iCount += g.index.count; });
  const pos = new Float32Array(vCount * 3), nor = new Float32Array(vCount * 3), idx = new Uint32Array(iCount);
  let vo = 0, io = 0;
  geos.forEach(g => {
    pos.set(g.attributes.position.array, vo * 3);
    nor.set(g.attributes.normal.array, vo * 3);
    const gi = g.index.array;
    for (let i = 0; i < gi.length; i++) idx[io + i] = gi[i] + vo;
    vo += g.attributes.position.count; io += gi.length;
    g.dispose();
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  return out;
}

// Мигли по ръба на клепача. Посоките се смятат в света (ветрило навън и нагоре/надолу),
// после се връщат в локалната система на клепача, за да се движат с него при мигане.
function lashes({ R, n, from, to, len, tilt, down = false, fan = 1, spread = .1, radius }) {
  const geos = [];
  const toLocal = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -tilt);
  const toWorld = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), tilt);
  const sy = down ? -1 : 1;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const phi = Math.PI * (from + (to - from) * t);
    for (let k = 0; k < fan; k++) {
      const off = fan > 1 ? (k / (fan - 1) - .5) * spread : 0;
      const base = new THREE.Vector3(Math.cos(phi), 0, Math.sin(phi)).multiplyScalar(R).applyQuaternion(toWorld);
      const L = len(t) * (.75 + Math.random() * .4);
      const curlAmt = .25 + Math.random() * .2;
      // посока: навън от центъра на окото в равнината на екрана + малко напред
      const out = new THREE.Vector3(base.x * 1.15, sy * (Math.abs(base.y) * .6 + .75), .55).normalize();
      out.applyAxisAngle(new THREE.Vector3(0, 0, 1), off + (Math.random() - .5) * .12);
      const curl = new THREE.Vector3(base.x * .35, sy, -.25).normalize();
      const p1 = base.clone().addScaledVector(out, L * .55);
      const p2 = base.clone().addScaledVector(out, L * .75).addScaledVector(curl, L * curlAmt);
      [base, p1, p2].forEach(v => v.applyQuaternion(toLocal));
      geos.push(lashGeometry(new THREE.QuadraticBezierCurve3(base, p1, p2), radius));
    }
  }
  return merge(geos);
}

export function init(host, { reduced, finePointer, pointer }) {
  const canvas = document.createElement("canvas");
  canvas.className = "eye3d";
  canvas.setAttribute("aria-hidden", "true");
  host.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 860 ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .92;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), .04).texture;

  const camera = new THREE.PerspectiveCamera(28, 1, .1, 50);
  camera.position.set(0, 0, 7.4);

  const key = new THREE.DirectionalLight(0xfff1e6, 1.6); key.position.set(3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xf3b8c0, 1.4); rim.position.set(-4, 1, -3); scene.add(rim);

  const root = new THREE.Group();
  scene.add(root);
  const eye = new THREE.Group();
  root.add(eye);

  // Очна ябълка
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(1, 96, 64),
    new THREE.MeshPhysicalMaterial({ map: eyeTexture(), roughness: .38, clearcoat: .8, clearcoatRoughness: .08, sheen: .3, sheenColor: new THREE.Color("#f6e2e5") })
  );
  eye.add(ball);

  // Клепачи — сатенено розово злато
  const lidMat = new THREE.MeshPhysicalMaterial({
    color: "#c09ca2", metalness: .32, roughness: .36, clearcoat: .8, clearcoatRoughness: .2,
    iridescence: .3, iridescenceIOR: 1.35, sheen: 1, sheenColor: new THREE.Color("#f5dce0"), side: THREE.DoubleSide
  });
  const lashMat = new THREE.MeshPhysicalMaterial({ color: "#1c191a", roughness: .35, clearcoat: .6, metalness: .1 });
  const LR = 1.05;

  const upper = new THREE.Group();
  upper.add(new THREE.Mesh(new THREE.SphereGeometry(LR, 96, 32, 0, Math.PI * 2, 0, Math.PI / 2), lidMat));
  const rimU = new THREE.Mesh(new THREE.TorusGeometry(LR, .032, 16, 160), lidMat);
  rimU.rotation.x = Math.PI / 2;
  upper.add(rimU);
  upper.add(new THREE.Mesh(lashes({ R: LR + .015, n: 50, from: .03, to: .97, fan: 3, spread: .2, radius: .0085, tilt: UPPER_OPEN,
    len: t => .26 + .3 * Math.pow(t, 1.3) + .08 * Math.sin(Math.PI * t) }), lashMat));
  upper.rotation.x = UPPER_OPEN;
  eye.add(upper);

  const lower = new THREE.Group();
  lower.add(new THREE.Mesh(new THREE.SphereGeometry(LR, 96, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), lidMat));
  const rimL = rimU.clone();
  lower.add(rimL);
  lower.add(new THREE.Mesh(lashes({ R: LR + .015, n: 30, from: .12, to: .88, radius: .0065, tilt: LOWER, down: true, len: t => .08 + .06 * t }), lashMat));
  lower.rotation.x = LOWER;
  eye.add(lower);

  // Перли в орбита и тънък златен пръстен
  const orbit = new THREE.Group();
  orbit.rotation.set(deg(72), deg(-14), deg(10));
  root.add(orbit);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.75, .008, 8, 220),
    new THREE.MeshPhysicalMaterial({ color: "#b3a8ac", metalness: 1, roughness: .22 }));
  orbit.add(ring);
  const pearlMat = new THREE.MeshPhysicalMaterial({
    color: "#f9f7f8", roughness: .14, clearcoat: 1, clearcoatRoughness: .05,
    iridescence: 1, iridescenceIOR: 1.3, iridescenceThicknessRange: [180, 520], sheen: 1, sheenColor: new THREE.Color("#f5dee2")
  });
  const pearls = [];
  const pearlGeo = new THREE.SphereGeometry(1, 48, 32);
  [.16, .1, .13, .08, .12, .07, .11].forEach((s, i) => {
    const p = new THREE.Mesh(pearlGeo, pearlMat);
    p.scale.setScalar(s);
    p.userData.a = (i / 7) * Math.PI * 2;
    orbit.add(p);
    pearls.push(p);
  });

  // Размер
  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  // Мигане
  let blinkStart = -1, nextBlink = performance.now() + 1800;
  const blinkCurve = k => (k < .35 ? easeIn(k / .35) : k < .45 ? 1 : 1 - easeOut((k - .45) / .55));
  const easeIn = t => t * t, easeOut = t => 1 - (1 - t) * (1 - t);

  // Въртене с мишката (и с пръст на телефон)
  const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  let drag = null;
  canvas.addEventListener("pointerdown", e => { drag = { x: e.clientX, y: e.clientY, tx: target.x, ty: target.y }; });
  addEventListener("pointerup", () => (drag = null));
  addEventListener("pointermove", e => {
    if (drag) {
      target.y = drag.ty + (e.clientX - drag.x) / 160;
      target.x = drag.tx + (e.clientY - drag.y) / 220;
    }
  }, { passive: true });

  let visible = true, raf = 0;
  const t0 = performance.now();
  function frame(now) {
    raf = 0;
    const t = (now - t0) / 1000;
    if (!drag && finePointer) {
      target.y = (pointer.x / innerWidth - .5) * 1.1;
      target.x = (pointer.y / innerHeight - .5) * .7;
    } else if (!drag) {
      target.y = Math.sin(t * .45) * .35;
      target.x = Math.sin(t * .3) * .12;
    }
    cur.x += (target.x - cur.x) * .06;
    cur.y += (target.y - cur.y) * .06;
    root.rotation.y = cur.y * .75;
    root.rotation.x = cur.x * .6;
    ball.rotation.y = cur.y * .35;                 // погледът следи курсора
    ball.rotation.x = cur.x * .25;
    root.position.y = Math.sin(t * .9) * .05;

    if (blinkStart < 0 && now > nextBlink) blinkStart = now;
    if (blinkStart >= 0) {
      const k = (now - blinkStart) / 760;
      upper.rotation.x = UPPER_OPEN + (UPPER_CLOSED - UPPER_OPEN) * blinkCurve(Math.min(1, k));
      if (k >= 1) { blinkStart = -1; nextBlink = now + 2800 + Math.random() * 3500; }
    }
    pearls.forEach((p, i) => {
      const a = p.userData.a + t * .25;
      p.position.set(Math.cos(a) * 1.75, Math.sin(a) * 1.75, Math.sin(t * 1.2 + i) * .05);
    });
    orbit.rotation.z = deg(10) + t * .05;
    renderer.render(scene, camera);
    loop();
  }
  function loop() { if (!raf && visible && !document.hidden && !reduced) raf = requestAnimationFrame(frame); }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; loop(); }).observe(host);
  document.addEventListener("visibilitychange", loop);

  renderer.render(scene, camera);
  if (reduced) frame(performance.now());
  host.classList.add("has-3d");
  loop();
}
