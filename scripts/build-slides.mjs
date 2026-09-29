#!/usr/bin/env node
// Build 16:9 slide editions of the rank-aligned org chart in four corporate tastes.
// Usage: node scripts/build-slides.mjs [config] [outDir] [--png]
//   --png  also export 3840x2160 PNGs to assets/slides/ via headless Chrome/Edge (CHROME_PATH to override)
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadOrg, page, esc } from '../src/variants/shared.mjs';
import { THEMES, buildRankSlide } from '../src/slides/rank-slide.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const png = args.includes('--png');
const [config = path.join(rootDir, 'examples/ai-retail-dx.org.json'), outDir = path.join(rootDir, 'slides')] = args.filter(a => !a.startsWith('--'));
const bundled = path.resolve(outDir) === path.join(rootDir, 'slides');

const org = loadOrg(config, rootDir);
mkdirSync(outDir, { recursive: true });
const files = THEMES.map((t, i) => {
  const file = `${String.fromCharCode(97 + i)}-${t.id.split('-').slice(1).join('-')}.html`;
  writeFileSync(path.join(outDir, file), buildRankSlide(org, t));
  console.log(`✔ ${file}`);
  return { ...t, file, png: file.replace(/\.html$/, '.png') };
});

const index = page({
  title: '体制図スライド 4テイスト',
  description: '階層そろえ体制図を16:9の会社スライド向けに4テイストで仕上げたもの。',
  css: `
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,560px),1fr));gap:18px}
.card{display:flex;flex-direction:column;background:var(--surface);border:1px solid var(--line);border-radius:14px;overflow:hidden;box-shadow:var(--shadow);text-decoration:none;color:inherit}
.shot{position:relative;aspect-ratio:16/9;overflow:hidden;border-bottom:1px solid var(--line)}
.shot iframe{position:absolute;inset:0;width:100%;height:100%;border:0;pointer-events:none}
.txt{padding:14px 16px 16px}
.txt .n{font-size:11px;font-weight:700;color:var(--ink-3);letter-spacing:.1em}
.txt h2{margin:2px 0 6px;font-size:17px}
.txt p{margin:0;font-size:13px;color:var(--ink-2);line-height:1.7}
.how{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:12px 18px;margin-bottom:18px;font-size:13px;color:var(--ink-2);line-height:1.8}
.how b{color:var(--ink)}
`,
  body: `<div class="page">
  <div class="topbar"><div>
    <div class="eyebrow">16:9 slide editions</div>
    <h1>${esc(org.title)} ― 体制図スライド 4テイスト</h1>
    <p class="sub">「階層そろえグリッド」を 1920×1080 のスライド用に仕上げたもの</p>
  </div><div class="tools"><button class="btn" id="themeBtn"></button></div></div>
  <div class="how"><b>スライドへの貼り方</b>：① PNG（3840×2160）をそのまま貼る ／ ② 各ページを開いて「印刷 → PDFに保存」で16:9のPDF ／ ③ ブラウザを全画面にしてそのまま投影</div>
  <div class="grid">${files
    .map((t, i) => `<a class="card" href="${t.file}"><div class="shot"><iframe src="${t.file}" loading="lazy" tabindex="-1" title="${esc(t.name)}"></iframe></div>
    <div class="txt"><div class="n">TASTE ${String.fromCharCode(65 + i)}</div><h2>${esc(t.name)}</h2><p>${esc(t.idea)}</p></div></a>`)
    .join('')}</div>
</div>`,
});
writeFileSync(path.join(outDir, 'index.html'), index);
console.log('✔ index.html');

if (bundled) {
  cpSync(outDir, path.join(rootDir, 'docs/public/slides'), { recursive: true });
  console.log('✔ docs/public/slides/');
}

if (png) {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);
  const chrome = candidates.find(p => existsSync(p));
  if (!chrome) throw new Error('Chrome/Edge not found. Set CHROME_PATH to export PNGs.');
  const pngDir = bundled ? path.join(rootDir, 'assets/slides') : outDir;
  mkdirSync(pngDir, { recursive: true });
  for (const t of files) {
    const target = path.join(pngDir, t.png);
    execFileSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=2', '--window-size=1920,1080',
      '--virtual-time-budget=5000', `--screenshot=${target}`, pathToFileURL(path.join(outDir, t.file)).href], { stdio: 'ignore' });
    console.log(`✔ ${path.relative(rootDir, target)}`);
  }
}
