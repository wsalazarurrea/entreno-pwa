/* Genera los PNG del icono a partir de design/icon.svg con un navegador headless.
   Uso: node scripts/render-icons.cjs [ruta-a-msedge-o-chrome]
   Requiere playwright-core (npx -y -p playwright-core node scripts/render-icons.cjs). */
const { chromium } = require("playwright-core");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const svg = fs.readFileSync(path.join(root, "design", "icon.svg"), "utf8");
const exe = process.argv[2] || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";

const OUT = [
  ["public/icon-512.png", 512],
  ["public/icon-192.png", 192],
  ["public/apple-touch-icon.png", 180],
  ["ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png", 1024],
];

(async () => {
  const browser = await chromium.launch({ executablePath: exe });
  const page = await browser.newPage();
  for (const [rel, size] of OUT) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<html><body style="margin:0;background:#1a0536">${svg.replace("<svg ", `<svg style="display:block;width:${size}px;height:${size}px" `)}</body></html>`);
    // Sin transparencia: iOS exige iconos opacos.
    await page.screenshot({ path: path.join(root, rel), omitBackground: false, clip: { x: 0, y: 0, width: size, height: size } });
    console.log("✓", rel, size);
  }
  await browser.close();
})();
