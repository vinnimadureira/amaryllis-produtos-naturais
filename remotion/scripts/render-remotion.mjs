// Render script: node scripts/render-remotion.mjs <desktop|mobile>
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const target = process.argv[2] ?? "desktop";
const compId = target === "mobile" ? "hero-mobile" : "hero-desktop";
const outFile = target === "mobile" ? "hero-mobile.mp4" : "hero-desktop.mp4";
const outputLocation = `/mnt/documents/${outFile}`;

console.log(`[render] bundling for ${compId}…`);
const bundled = await bundle({
  entryPoint: path.resolve(__dirname, "../src/index.ts"),
  webpackOverride: (config) => config,
});

console.log("[render] opening browser…");
const browser = await openBrowser("chrome", {
  browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH ?? "/bin/chromium",
  chromiumOptions: {
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  },
  chromeMode: "chrome-for-testing",
});

const composition = await selectComposition({
  serveUrl: bundled,
  id: compId,
  puppeteerInstance: browser,
});

console.log(`[render] rendering ${composition.width}x${composition.height} → ${outputLocation}`);
await renderMedia({
  composition,
  serveUrl: bundled,
  codec: "h264",
  outputLocation,
  puppeteerInstance: browser,
  muted: true,
  concurrency: 1,
  crf: 20,
  onProgress: ({ progress }) => {
    if (Math.round(progress * 100) % 10 === 0) {
      process.stdout.write(`\r[render] ${Math.round(progress * 100)}%   `);
    }
  },
});

await browser.close({ silent: false });
console.log(`\n[render] done → ${outputLocation}`);
