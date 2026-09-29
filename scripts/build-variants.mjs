#!/usr/bin/env node
// Build the four alternative, self-contained chart variants from a *.org.json config.
// Usage: node scripts/build-variants.mjs [config] [outDir]
import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadOrg, page, esc } from '../src/variants/shared.mjs';
import { buildCleanTree } from '../src/variants/v1-clean-tree.mjs';
import { buildMatrix } from '../src/variants/v2-matrix.mjs';
import { buildExplorer } from '../src/variants/v3-explorer.mjs';
import { buildRadial } from '../src/variants/v4-radial.mjs';
import { buildTopdownTree } from '../src/variants/v5-topdown-tree.mjs';
import { buildRankGrid } from '../src/variants/v6-rank-grid.mjs';
import { buildIcicle } from '../src/variants/v7-icicle.mjs';
import { buildOutline } from '../src/variants/v8-outline.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [config = path.join(rootDir, 'examples/ai-retail-dx.org.json'), outDir = path.join(rootDir, 'variants')] = process.argv.slice(2);

const org = loadOrg(config, rootDir);
mkdirSync(outDir, { recursive: true });

const variants = [
  { file: '01-clean-tree.html', name: 'クリーンツリー', build: buildCleanTree,
    idea: '色の意味を「所属会社」だけに一本化。チームは無彩色の列にし、会社構成バーで混成度を表示。A4横で印刷できる定番の体制図。' },
  { file: '02-matrix.html', name: '会社 × チーム マトリクス', build: buildMatrix,
    idea: '行＝会社、列＝チーム。マルチベンダ体制で一番知りたい「どの会社が誰をどこに出しているか」を表で即答。混成・兼務も自動で抽出。' },
  { file: '03-explorer.html', name: 'インタラクティブ・エクスプローラー', build: buildExplorer,
    idea: 'クリックで上長〜部下の指揮系統をハイライト、右パネルに役割・レポート先・担当業務。検索と会社フィルタ付きで大人数でも迷わない。' },
  { file: '04-radial.html', name: '放射型マップ', build: buildRadial,
    idea: 'オーナーを中心に、指揮系統の深さを距離、チームを扇形で表現。ホバーでオーナーまでの系統を表示。キックオフ資料の表紙向け。' },
  { file: '05-topdown-tree.html', name: 'トップダウン・ツリー', build: buildTopdownTree, group: 'topdown',
    idea: '一番素直な組織図。上長の真下に部下を中央揃えで配置し、チームは背景の枠で囲む。線が交差せず、上から下へ一筆で読める。' },
  { file: '06-rank-grid.html', name: '階層そろえグリッド', build: buildRankGrid, group: 'topdown',
    idea: '行＝立場（オーナー→統括→主担当→メンバー）、列＝チーム。同じ立場の人が必ず同じ高さに並ぶので、チーム間の横比較がしやすい。' },
  { file: '07-icicle.html', name: '責任範囲マップ（アイシクル）', build: buildIcicle, group: 'topdown',
    idea: 'ブロックの横幅＝その人が責任を持つ範囲。真下にあるものが配下。線を使わず面の入れ子だけで指揮系統と「誰がどこまで見ているか」を表現。' },
  { file: '08-outline.html', name: '縦スクロール・アウトライン', build: buildOutline, group: 'topdown',
    idea: 'スマホ・Slack・Notion向けの1列表示。上から下へスクロールするだけで全体が読め、タップで配下を開閉。「主担当まで」で要約表示も。' },
];

for (const v of variants) {
  writeFileSync(path.join(outDir, v.file), v.build(org));
  console.log(`✔ ${v.file}`);
}

const index = page({
  title: '体制図 8つの提案',
  description: '同じ org.json から生成した8種類の体制図バリエーション。',
  css: `
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,520px),1fr));gap:16px}
.card{display:flex;flex-direction:column;background:var(--surface);border:1px solid var(--line);border-radius:14px;overflow:hidden;box-shadow:var(--shadow);text-decoration:none;color:inherit}
.card:hover{border-color:var(--line-strong)}
.shot{position:relative;height:300px;overflow:hidden;background:var(--bg);border-bottom:1px solid var(--line)}
.shot iframe{position:absolute;top:0;left:0;width:1320px;height:900px;border:0;transform:scale(.4);transform-origin:0 0;pointer-events:none}
.txt{padding:14px 16px 16px}
.txt .n{font-size:11px;font-weight:700;color:var(--ink-3);letter-spacing:.1em}
.txt h2{margin:2px 0 6px;font-size:17px}
.txt p{margin:0;font-size:13px;color:var(--ink-2);line-height:1.7}
.sec{font-size:15px;margin:26px 2px 10px;color:var(--ink)}
.fix{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px 18px;margin-bottom:18px;font-size:13px;color:var(--ink-2)}
.fix ul{margin:6px 0 0;padding-left:18px;line-height:1.8}
.fix b{color:var(--ink)}
`,
  body: `<div class="page">
  <div class="topbar"><div>
    <div class="eyebrow">Org chart variations</div>
    <h1>${esc(org.title)} ― 体制図 8つの提案</h1>
    <p class="sub">すべて <code>${esc(path.basename(config))}</code> から自動生成・単一HTML（アバター埋め込み済み）</p>
  </div><div class="tools"><button class="btn" id="themeBtn"></button></div></div>
  <div class="fix"><b>共通の改善方針</b><ul>
    <li><b>色は1つの意味だけ</b>：部署色と会社色の二重コードをやめ、色＝所属会社に統一</li>
    <li><b>同じ会社は1社として集計</b>：アークシステムズ（プライム／品質管理T）を統合し「4社」と凡例を一致</li>
    <li><b>兼務を明示</b>：伊藤さんのPMO補佐＋品質管理T主担当を1人として扱い「兼」表示</li>
    <li><b>見切れ・装飾ノイズを削減</b>：点線枠・グリッド背景をなくし、役割テキストを省略せず表示。ライト/ダーク両対応</li>
  </ul></div>
  ${[['base', '横断ビュー（01–04）'], ['topdown', '上から下へ読む案（05–08）']]
    .map(([g, title]) => `<h2 class="sec">${title}</h2><div class="grid">${variants
    .map((v, i) => ({ v, i }))
    .filter(({ v }) => (v.group || 'base') === g)
    .map(({ v, i }) => `<a class="card" href="${v.file}"><div class="shot"><iframe src="${v.file}" loading="lazy" tabindex="-1" title="${esc(v.name)}"></iframe></div>
    <div class="txt"><div class="n">IDEA ${String(i + 1).padStart(2, '0')}</div><h2>${esc(v.name)}</h2><p>${esc(v.idea)}</p></div></a>`)
    .join('')}</div>`)
    .join('')}
</div>`,
});
writeFileSync(path.join(outDir, 'index.html'), index);
console.log('✔ index.html');

// Mirror the bundled showcase into the docs site so GitHub Pages serves it as a live demo.
if (path.resolve(outDir) === path.join(rootDir, 'variants')) {
  cpSync(outDir, path.join(rootDir, 'docs/public/variants'), { recursive: true });
  console.log('✔ docs/public/variants/');
}
