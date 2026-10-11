/* Descarga las imágenes de free-exercise-db (dominio público, Unlicense) usadas por las
   fichas de técnica y las reduce a 360 px de ancho en public/tech/<id>-0.jpg y -1.jpg.
   Uso: node scripts/fetch-tech-images.cjs [ruta-a-msedge-o-chrome]  (requiere playwright-core) */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

const OUT = path.join(__dirname, "..", "public", "tech");
const RAW = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";
const exe = process.argv[2] || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";

(async () => {
  const toUrl = (p) => "file:///" + path.join(__dirname, "..", p).replace(/\\/g, "/");
  const X = await import(toUrl("src/data/techExtras.js"));
  const ids = [...new Set([...Object.values(X.IMG), ...X.IMG_BY_NAME.map(r => r[1])])];
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: exe });
  const page = await browser.newPage();
  let n = 0, bytes = 0;
  for (const id of ids) {
    for (const i of [0, 1]) {
      const dest = path.join(OUT, `${id}-${i}.jpg`);
      if (fs.existsSync(dest)) continue;
      const res = await fetch(`${RAW}/${id}/${i}.jpg`);
      if (!res.ok) { console.log("✗", id, i, res.status); continue; }
      const b64 = Buffer.from(await res.arrayBuffer()).toString("base64");
      const out = await page.evaluate(async (src) => {
        const img = new Image(); img.src = src; await img.decode();
        const w = Math.min(360, img.naturalWidth), h = Math.round(img.naturalHeight * w / img.naturalWidth);
        const c = document.createElement("canvas"); c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        return c.toDataURL("image/jpeg", 0.72).split(",")[1];
      }, `data:image/jpeg;base64,${b64}`);
      const buf = Buffer.from(out, "base64");
      fs.writeFileSync(dest, buf); n++; bytes += buf.length;
    }
  }
  await browser.close();
  console.log(`${n} imágenes nuevas · ${(bytes / 1024 / 1024).toFixed(1)} MB`);
})();
