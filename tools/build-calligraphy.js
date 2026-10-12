// Превръща акцентните думи в заглавията (<em> в h1/h2 и подписа) в калиграфски SVG,
// които main.js „изписва“ с перо при скрол.
// Пускане след промяна на заглавие:  npm i opentype.js@1.3.4  &&  node tools/build-calligraphy.js
const fs = require("fs");
const path = require("path");
const opentype = require(process.env.OPENTYPE || "opentype.js");

const root = path.join(__dirname, "..");
const font = opentype.loadSync(path.join(root, "assets/fonts/GreatVibes-Regular.ttf"));
const SCALE = 1.32; // Great Vibes е по-дребен от Cormorant при същия размер

function callig(text, cls = "callig") {
  const p = font.getPath(text, 0, 0, 100);
  const b = p.getBoundingBox();
  const pad = 4;
  const x = b.x1 - pad, y = b.y1 - pad, w = b.x2 - b.x1 + pad * 2, h = b.y2 - b.y1 + pad * 2;
  const em = v => +(v / 100 * SCALE).toFixed(3) + "em";
  const d = p.toPathData(1);
  return `<span class="${cls}"><span class="sr-only">${text}</span>` +
    `<svg aria-hidden="true" viewBox="${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}" ` +
    `style="width:${em(w)};height:${em(h)};vertical-align:-${em(b.y2 + pad)}"><path d="${d}" pathLength="1"/></svg></span>`;
}

const file = path.join(root, "index.html");
let html = fs.readFileSync(file, "utf8");
// Връщаме вече генерираните думи към обикновен текст, за да е идемпотентно
html = html.replace(/<span class="(callig[^"]*)"><span class="sr-only">([^<]*)<\/span><svg[\s\S]*?<\/svg><\/span>/g,
  (m, cls, t) => (cls.includes("callig--sig") ? `@@SIG@@${t}` : `<em>${t}</em>`));
html = html.replace(/<em class="callig-em"><em>([^<]*)<\/em><\/em>/g, "<em>$1</em>");
// h1/h2 акценти
html = html.replace(/(<h[12][^>]*>[^]*?)<em>([^<]+)<\/em>/g, (m, pre, t) => `${pre}<em class="callig-em">${callig(t)}</em>`);
// подпис
html = html.replace(/<p class="signature">(?:@@SIG@@)?([^<]+)<\/p>/, (m, t) => `<p class="signature">${callig(t, "callig callig--sig")}</p>`);
fs.writeFileSync(file, html);
console.log("calligraphy:", (html.match(/class="callig/g) || []).length);
