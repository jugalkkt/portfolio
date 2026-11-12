/**
 * Renders public/og.jpg (1200×630; JPEG keeps it under the 150 KB image budget), public/apple-touch-icon.png (180×180) and
 * public/favicon.ico (16 + 32 px PNGs) in headless Chromium, from the same seeded hero
 * poster and Geist fonts the site uses. public/favicon.svg is hand-written.
 * Run with: npm run build:brand
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";
import { renderToStaticMarkup } from "react-dom/server";
import { HeroPoster } from "../src/components/hero/HeroPoster";
import { identity } from "../src/content/resume";
import { copy } from "../src/content/copy";

const root = resolve(import.meta.dirname, "..");
const pub = (f: string) => resolve(root, "public", f);
const font = (f: string) =>
  readFileSync(resolve(root, "node_modules/geist/dist/fonts", f)).toString("base64");

const tokens = `
  :root { --bg:#06080c; --bg-raised:#0b0f16; --line:#1a2230; --line-strong:#2a3546;
          --text:#e7ecf3; --text-muted:#94a0b2; --signal:#4fd1e8; --activation:#8b7cf6; }
  @font-face { font-family: Geist; font-weight: 100 900;
    src: url(data:font/woff2;base64,${font("geist-sans/Geist-Variable.woff2")}) format("woff2"); }
  @font-face { font-family: GeistMono; font-weight: 100 900;
    src: url(data:font/woff2;base64,${font("geist-mono/GeistMono-Variable.woff2")}) format("woff2"); }
  * { margin: 0; box-sizing: border-box; }
  html, body { background: var(--bg); color: var(--text); font-family: Geist, sans-serif; }
`;

const og = `<!doctype html><html><head><style>${tokens}
  body { width: 1200px; height: 630px; position: relative; overflow: hidden; }
  .net { position: absolute; right: -60px; top: 15px; width: 800px; height: 600px; }
  .fade { position: absolute; inset: 0;
    background: radial-gradient(ellipse at 18% 50%, var(--bg) 30%, transparent 72%); }
  .copy { position: absolute; left: 80px; top: 0; bottom: 0; display: flex;
    flex-direction: column; justify-content: center; gap: 22px; width: 680px; }
  .kicker { font-family: GeistMono; font-size: 22px; color: var(--signal); }
  h1 { font-size: 96px; font-weight: 600; letter-spacing: -0.03em; line-height: 1; }
  .rule { width: 120px; height: 2px; background: linear-gradient(90deg, var(--signal), var(--activation)); }
  .headline { font-size: 36px; font-weight: 500; }
  .tag { font-size: 26px; color: var(--text-muted); line-height: 1.45; max-width: 600px; }
</style></head><body>
  <div class="net">${renderToStaticMarkup(<HeroPoster className="net-svg" />).replace("<svg", '<svg width="800" height="600"')}</div>
  <div class="fade"></div>
  <div class="copy">
    <p class="kicker">${copy.hero.kicker}</p>
    <h1>${identity.name}</h1>
    <div class="rule"></div>
    <p class="headline">${identity.headline}</p>
    <p class="tag">${copy.hero.tagline}</p>
  </div>
</body></html>`;

const iconPage = (size: number) => `<!doctype html><html><head><style>${tokens}
  body { width: ${size}px; height: ${size}px; background: transparent; }
  img { width: ${size}px; height: ${size}px; display: block; }
</style></head><body><img src="data:image/svg+xml;base64,${readFileSync(pub("favicon.svg")).toString("base64")}"></body></html>`;

/** ICO container holding PNG images (supported by every current browser). */
function ico(images: { size: number; png: Buffer }[]) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, png }, i) => {
    const e = 6 + i * 16;
    header.writeUInt8(size % 256, e);
    header.writeUInt8(size % 256, e + 1);
    header.writeUInt16LE(1, e + 4); // colour planes
    header.writeUInt16LE(32, e + 6); // bits per pixel
    header.writeUInt32LE(png.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...images.map((i) => i.png)]);
}

async function main() {
  const browser = await chromium.launch();
  const shot = async (html: string, w: number, h: number, transparent = false, jpeg = false) => {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.setContent(html);
    await page.evaluate(() => document.fonts.ready);
    const png = await page.screenshot(
      jpeg ? { type: "jpeg", quality: 90 } : { omitBackground: transparent },
    );
    await page.close();
    return png;
  };

  writeFileSync(pub("og.jpg"), await shot(og, 1200, 630, false, true));
  writeFileSync(pub("apple-touch-icon.png"), await shot(iconPage(180), 180, 180));
  writeFileSync(
    pub("favicon.ico"),
    ico([
      { size: 16, png: await shot(iconPage(16), 16, 16, true) },
      { size: 32, png: await shot(iconPage(32), 32, 32, true) },
    ]),
  );
  await browser.close();
  console.log("wrote og.jpg, apple-touch-icon.png, favicon.ico");
}

main();
