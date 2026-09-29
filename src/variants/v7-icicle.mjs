// Variant 7: Icicle (span of control). Top-down; each person's width equals the span they are responsible for.
import { esc, page, legendHtml, company } from './shared.mjs';

export function buildIcicle(org) {
  const P = org.people;
  const place = new Map();
  let leafCol = 0, maxDepth = 0;
  const descendants = id => P.get(id).children.reduce((n, k) => n + 1 + descendants(k), 0);
  (function lay(id, depth) {
    const p = P.get(id);
    maxDepth = Math.max(maxDepth, depth);
    const start = leafCol;
    if (!p.children.length) leafCol++;
    else p.children.forEach(k => lay(k, depth + 1));
    place.set(id, { start, span: leafCol - start, depth });
  })(org.ownerId, 0);
  const cols = leafCol;

  const blocks = [...place]
    .map(([id, { start, span, depth }]) => {
      const p = P.get(id), c = company(org, p), a = p.primary;
      const other = p.assignments.find(x => x !== a);
      const unit = a.deptIndex < 0 ? (a.unit === org.pmTitle ? 'PM' : 'オーナー') : a.unit;
      const n = descendants(id);
      return `<div class="blk${span > 1 ? ' wide' : ''}" data-id="${id}" data-parent="${p.parent || ''}" tabindex="0"
        style="grid-column:${start + 2}/span ${span};grid-row:${depth + 1};--c:${c.color}">
        <img class="av" src="${p.avatar}" alt="">
        <div class="m">
          <div class="unit">${esc(unit)}${a.badge ? ` · ${esc(a.badge)}` : ''}</div>
          <div class="nm">${esc(p.name)}</div>
          <div class="rl">${esc(a.role)}</div>
          <div class="ft"><span class="cochip">${esc(c.short)}</span>${n ? `<span class="span">配下 ${n}名</span>` : ''}${other ? `<span class="dual">兼 ${esc(other.unit === org.pmTitle ? 'PM' : other.unit)}</span>` : ''}</div>
        </div>
      </div>`;
    })
    .join('');

  // Team band under the leaves: consecutive leaf columns of the same team merge.
  const leaves = [...place].filter(([id]) => !P.get(id).children.length).sort((a, b) => a[1].start - b[1].start);
  const bands = [];
  leaves.forEach(([id, pl]) => {
    const d = P.get(id).deptIndex;
    const last = bands[bands.length - 1];
    if (last && last.d === d) last.span++;
    else bands.push({ d, start: pl.start, span: 1 });
  });
  const teamRow = maxDepth + 2;
  const teams = bands
    .map(b => {
      const d = org.depts[b.d];
      return `<div class="team" style="grid-column:${b.start + 2}/span ${b.span};grid-row:${teamRow}"><b>${esc(d?.name ?? '')}</b><span>${d ? d.memberIds.length + '名' : ''}</span></div>
      <div class="roles" style="grid-column:${b.start + 2}/span ${b.span};grid-row:${teamRow + 1}"><ul>${(d?.roles ?? []).map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>`;
    })
    .join('');
  const labels = Array.from({ length: maxDepth + 1 }, (_, i) => `<div class="lvl" style="grid-row:${i + 1}">L${i}</div>`).join('');

  const body = `<div class="page">
  <div class="topbar">
    <div>
      <div class="eyebrow">Span of Control · ${esc(org.date)}</div>
      <h1>${esc(org.title)} <span class="h1s">責任範囲マップ</span></h1>
      <p class="sub">上から下へ。各人の<b>横幅＝責任を持つ範囲</b>。真下にあるブロックがその人の配下です</p>
    </div>
    <div class="tools"><button class="btn" onclick="print()">印刷 / PDF</button><button class="btn" id="themeBtn"></button></div>
  </div>
  <div class="legendbar">${legendHtml(org)}</div>
  <div class="scroller"><div class="ice" id="ice" style="min-width:${36 + cols * 176}px;grid-template-columns:36px repeat(${cols},minmax(170px,1fr));grid-template-rows:repeat(${maxDepth + 1},minmax(92px,auto)) auto auto">
    ${labels}${blocks}${teams}
  </div></div>
  <p class="hint">ブロックにカーソルを合わせると、上長と配下がハイライトされます</p>
</div>`;

  const css = `
.h1s{font-weight:500;color:var(--ink-2);font-size:18px;margin-left:4px}
.sub b{color:var(--ink)}
.legendbar{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:10px 14px;margin-bottom:16px}
.scroller{overflow-x:auto;background:var(--surface);border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow);padding:14px 14px 14px 6px}
.ice{display:grid;gap:6px}
.lvl{grid-column:1;display:flex;align-items:center;justify-content:center;font-size:10.5px;font-weight:700;color:var(--ink-3);letter-spacing:.08em}
.blk{position:relative;display:flex;gap:10px;align-items:center;padding:10px 12px 10px 14px;border-radius:10px;overflow:hidden;
  background:color-mix(in srgb,var(--c) 10%,var(--surface));border:1px solid color-mix(in srgb,var(--c) 35%,var(--line));transition:opacity .15s,box-shadow .15s;outline:none}
.blk::before{content:"";position:absolute;left:0;top:0;bottom:0;width:5px;background:var(--c)}
.blk.wide{justify-content:center}
.blk .av{width:44px;height:44px}
.blk .m{min-width:0}
.unit{font-size:10.5px;font-weight:700;color:var(--ink-2);letter-spacing:.04em}
.nm{font-size:15px;font-weight:700;line-height:1.3}
.rl{font-size:12px;color:var(--ink-2);line-height:1.35}
.ft{display:flex;flex-wrap:wrap;gap:2px 10px;margin-top:4px;align-items:center}
.ft .span{font-size:11px;font-weight:700;color:var(--ink)}
.ft .dual{font-size:10px;font-weight:700;background:var(--ink);color:var(--surface);border-radius:4px;padding:1px 6px}
.team{display:flex;gap:8px;align-items:baseline;justify-content:center;padding:8px;border-radius:8px;background:var(--ink);color:var(--surface);margin-top:8px}
.team b{font-size:14px}
.team span{font-size:11.5px;opacity:.75}
.roles{padding:4px 6px}
.roles ul{margin:0;padding-left:16px;font-size:12px;color:var(--ink-2);line-height:1.7}
.hint{font-size:11.5px;color:var(--ink-3);margin:10px 2px 0}
.ice.focus .blk{opacity:.3}
.ice.focus .blk.on{opacity:1}
.ice.focus .blk.self{box-shadow:0 0 0 2px var(--ink)}
@media print{@page{size:A4 landscape;margin:8mm}.page{padding:0;max-width:none}.scroller{box-shadow:none;overflow:visible}.ice{min-width:0}}
`;

  const js = `
(function(){
  var ice=document.getElementById('ice'), blks=[].slice.call(ice.querySelectorAll('.blk'));
  var by={}; blks.forEach(function(b){by[b.dataset.id]=b;});
  function kids(id){return blks.filter(function(b){return b.dataset.parent===id;}).map(function(b){return b.dataset.id;});}
  function show(id){
    var on=new Set([id]), p=by[id].dataset.parent;
    while(p){on.add(p);p=by[p]?by[p].dataset.parent:'';}
    (function w(i){kids(i).forEach(function(k){on.add(k);w(k);});})(id);
    ice.classList.add('focus');
    blks.forEach(function(b){b.classList.toggle('on',on.has(b.dataset.id));b.classList.toggle('self',b.dataset.id===id);});
  }
  function clear(){ice.classList.remove('focus');blks.forEach(function(b){b.classList.remove('on','self');});}
  blks.forEach(function(b){b.addEventListener('mouseenter',function(){show(b.dataset.id);});b.addEventListener('focus',function(){show(b.dataset.id);});});
  ice.addEventListener('mouseleave',clear);
})();`;

  return page({ title: '責任範囲マップ', description: '各人のブロック幅が責任範囲を表す、上から下へのアイシクル型体制図。', css, body, js });
}
