// Variant 5: Classic top-down tree. Reports sit centered under their manager; teams are background frames.
import { esc, page, legendHtml, company } from './shared.mjs';

const W = 206, H = 100, XS = 244, YS = 158, PAD = 28, TOP = 36;

export function buildTopdownTree(org) {
  const P = org.people;
  // Tidy layout: leaves take consecutive columns, parents center over their children.
  const pos = new Map();
  let col = 0, maxDepth = 0;
  (function lay(id, depth) {
    const p = P.get(id);
    maxDepth = Math.max(maxDepth, depth);
    p.children.forEach(k => lay(k, depth + 1));
    let x;
    if (!p.children.length) x = col++;
    else {
      const xs = p.children.map(k => pos.get(k).x);
      x = (Math.min(...xs) + Math.max(...xs)) / 2;
    }
    pos.set(id, { x, depth });
  })(org.ownerId, 0);

  const left = id => PAD + pos.get(id).x * XS;
  const top = id => TOP + pos.get(id).depth * YS;
  const CW = PAD * 2 + (col - 1) * XS + W;
  const CH = TOP + maxDepth * YS + H + PAD;

  const frames = org.depts
    .map(d => {
      const xs = d.memberIds.map(left), ys = d.memberIds.map(top);
      const x0 = Math.min(...xs) - 10, x1 = Math.max(...xs) + W + 10;
      const y0 = Math.min(...ys) - 30, y1 = Math.max(...ys) + H + 12;
      return `<div class="frame" style="left:${x0}px;top:${y0}px;width:${x1 - x0}px;height:${y1 - y0}px">
        <span class="fl"><b>${esc(d.name)}</b> ${d.memberIds.length}名</span></div>`;
    })
    .join('');

  const wires = [...P.values()]
    .filter(p => p.parent && pos.has(p.parent))
    .map(p => {
      const x1 = left(p.parent) + W / 2, y1 = top(p.parent) + H;
      const x2 = left(p.id) + W / 2, y2 = top(p.id);
      const m = y1 + 14;
      if (Math.abs(x1 - x2) < 1) return `<path d="M${x1},${y1}V${y2}"/>`;
      const s = x2 > x1 ? 1 : -1, r = 8;
      return `<path d="M${x1},${y1}V${m - r}Q${x1},${m} ${x1 + s * r},${m}H${x2 - s * r}Q${x2},${m} ${x2},${m + r}V${y2}"/>`;
    })
    .join('');

  const cards = [...pos.keys()]
    .map(id => {
      const p = P.get(id), c = company(org, p), a = p.primary;
      const other = p.assignments.find(x => x !== a);
      const unit = a.deptIndex < 0 ? (a.unit === org.pmTitle ? 'PM' : 'オーナー') : a.unit;
      return `<div class="card${pos.get(id).depth === 0 ? ' root' : ''}" style="left:${left(id)}px;top:${top(id)}px;--c:${c.color}">
        <div class="unit"><span>${esc(unit)}${a.badge ? ` · ${esc(a.badge)}` : ''}</span>${other ? `<span class="dual">兼 ${esc(other.unit === org.pmTitle ? 'PM' : other.unit)} ${esc(other.badge)}</span>` : ''}</div>
        <div class="row"><img class="av" src="${p.avatar}" alt=""><div class="m">
          <div class="nm">${esc(p.name)}</div>
          <div class="rl">${esc(a.role)}</div>
          <div class="cochip">${esc(c.short)}</div>
        </div></div>
      </div>`;
    })
    .join('');

  const body = `<div class="page">
  <div class="topbar">
    <div>
      <div class="eyebrow">Top-down Tree · ${esc(org.date)}</div>
      <h1>${esc(org.title)} <span class="h1s">トップダウン体制図</span></h1>
      <p class="sub">上から下へ、上長の真下に部下。背景の枠がチーム、左の色帯とアバターの輪が所属会社です</p>
    </div>
    <div class="tools"><button class="btn" onclick="print()">印刷 / PDF</button><button class="btn" id="themeBtn"></button></div>
  </div>
  <div class="legendbar">${legendHtml(org)}</div>
  <div class="stage" id="stage"><div class="fit" id="fit"><div class="canvas" id="canvas" style="width:${CW}px;height:${CH}px">
    ${frames}<svg class="wires" width="${CW}" height="${CH}" aria-hidden="true">${wires}</svg>${cards}
  </div></div></div>
</div>`;

  const css = `
.h1s{font-weight:500;color:var(--ink-2);font-size:18px;margin-left:4px}
.legendbar{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:10px 14px;margin-bottom:16px}
.stage{background:var(--surface);border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow);overflow-x:auto;padding:12px 0}
.fit{position:relative;margin:0 auto;overflow:clip}
.canvas{position:absolute;left:0;top:0;transform-origin:0 0}
.frame{position:absolute;border:1px solid var(--line);background:var(--surface-2);border-radius:14px}
.fl{position:absolute;left:12px;top:6px;font-size:11.5px;color:var(--ink-2)}
.fl b{color:var(--ink);font-size:13px;margin-right:2px}
.wires{position:absolute;left:0;top:0;overflow:visible}
.wires path{fill:none;stroke:var(--ink-3);stroke-width:1.5}
.card{position:absolute;width:${W}px;height:${H}px;background:var(--surface);border:1px solid var(--line-strong);border-top:4px solid var(--c);
  border-radius:10px;padding:7px 11px 8px;box-shadow:var(--shadow)}
.card.root{box-shadow:0 0 0 2px var(--ink),var(--shadow)}
.unit{display:flex;justify-content:space-between;gap:6px;font-size:10.5px;font-weight:700;color:var(--ink-3);letter-spacing:.04em;white-space:nowrap}
.row{display:flex;gap:10px;align-items:center;margin-top:4px}
.card .av{width:38px;height:38px}
.m{min-width:0}
.nm{font-weight:700;font-size:14px;white-space:nowrap}
.rl{font-size:11.5px;color:var(--ink-2);line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.card .cochip{font-size:10.5px}
.dual{font-size:10px;font-weight:700;background:var(--ink);color:var(--surface);border-radius:4px;padding:0 5px;letter-spacing:0}
@media print{@page{size:A4 landscape;margin:8mm}.page{padding:0;max-width:none}.stage{box-shadow:none;overflow:visible}}
`;

  const js = `
(function(){
  var stage=document.getElementById('stage'), fit=document.getElementById('fit'), canvas=document.getElementById('canvas');
  var CW=${CW}, CH=${CH};
  function f(){var s=Math.max(.55,Math.min(1,(stage.clientWidth-24)/CW));
    canvas.style.transform='scale('+s+')'; fit.style.width=(CW*s)+'px'; fit.style.height=(CH*s)+'px';}
  addEventListener('resize',f); f();
})();`;

  return page({ title: 'トップダウン体制図', description: '上長の真下に部下を配置し、チームを背景枠で示した上から下へのクラシックな体制図。', css, body, js });
}
