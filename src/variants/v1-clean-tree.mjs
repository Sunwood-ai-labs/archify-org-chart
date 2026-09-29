// Variant 1: Clean hierarchy tree. Color encodes company only; departments stay neutral.
import { esc, page, legendHtml, company } from './shared.mjs';

function card(org, p, { assignment = p.primary, note = '', size = '' } = {}) {
  const c = company(org, p);
  return `<div class="card ${size}" data-id="${p.id}" style="--c:${c.color}">
    <img class="av" src="${p.avatar}" alt="">
    <div class="meta">
      <div class="nm">${esc(p.name)}${assignment.badge ? ` <span class="tag${assignment.badge === '主担当' ? '' : ' soft'}">${esc(assignment.badge)}</span>` : ''}</div>
      <div class="rl">${esc(assignment.role)}</div>
      <div class="cochip">${esc(c.short)}</div>
      ${note ? `<div class="note">${esc(note)}</div>` : ''}
    </div>
  </div>`;
}

function otherAssignmentNote(p, current) {
  const other = p.assignments.find(a => a !== current);
  return other ? `兼 ${other.unit}${other.badge ? ' ' + other.badge : ''}` : '';
}

function deptTree(org, dept) {
  const inDept = new Set(dept.memberIds);
  const assignmentFor = p => p.assignments.find(a => a.deptIndex === dept.index);
  const node = id => {
    const p = org.people.get(id);
    const a = assignmentFor(p);
    const kids = p.children.filter(k => inDept.has(k));
    return `<li>${card(org, p, { assignment: a, note: otherAssignmentNote(p, a) })}${kids.length ? `<ul>${kids.map(node).join('')}</ul>` : ''}</li>`;
  };
  const roots = dept.memberIds.filter(id => !inDept.has(org.people.get(id).parent));
  return `<ul class="tree root">${roots.map(node).join('')}</ul>`;
}

function mixBar(org, dept) {
  const counts = new Map();
  dept.memberIds.forEach(id => {
    const c = company(org, org.people.get(id));
    counts.set(c, (counts.get(c) || 0) + 1);
  });
  const segs = [...counts].map(([c, n]) => `<i style="flex:${n};background:${c.color}" title="${esc(c.short)} ${n}名"></i>`).join('');
  const names = [...counts].map(([c, n]) => `<span class="cochip" style="--c:${c.color}">${esc(c.short)} ${n}</span>`).join('');
  return `<div class="mix">${segs}</div><div class="mixnames">${names}</div>`;
}

export function buildCleanTree(org) {
  const owner = org.people.get(org.ownerId);
  const pmLead = org.people.get(org.pmLeadId);
  const pmMembers = org.pmMemberIds.map(id => org.people.get(id));
  const pmAssign = p => p.assignments.find(a => a.unit === org.pmTitle);

  const cols = org.depts
    .map(
      d => `<section class="col">
      <header class="colh" id="dh-${d.index}">
        <div class="colt"><span class="num">${String(d.index + 1).padStart(2, '0')}</span><span class="dn">${esc(d.name)}</span><span class="cnt">${d.memberIds.length}名</span></div>
        ${mixBar(org, d)}
      </header>
      <div class="colm">${deptTree(org, d)}</div>
      <div class="colr"><div class="lbl">担当業務</div><ul>${d.roles.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>
    </section>`
    )
    .join('');

  const body = `<div class="page">
  <div class="topbar">
    <div>
      <div class="eyebrow">Project Governance · ${esc(org.date)}</div>
      <h1>${esc(org.title)} <span class="h1s">プロジェクト体制図</span></h1>
      <p class="sub">${org.companies.length}社 · ${org.people.size}名 · ${org.depts.length}チーム ／ 色は「所属会社」、列は「チーム」を表します</p>
    </div>
    <div class="tools"><button class="btn" onclick="print()">印刷 / PDF</button><button class="btn" id="themeBtn"></button></div>
  </div>
  <div class="legendbar">${legendHtml(org)}</div>
  <div class="board" id="board">
    <svg class="wires" id="wires" aria-hidden="true"></svg>
    <div class="gov">
      <section class="unit" id="u-owner">
        <div class="ulbl">プロジェクトオーナー</div>
        ${card(org, owner, { size: 'lg' })}
      </section>
      <section class="unit pm" id="u-pm">
        <div class="ulbl">${esc(org.pmTitle)}</div>
        <div class="pmrow">
          ${card(org, pmLead, { assignment: pmAssign(pmLead), size: 'lg' })}
          ${pmMembers.map(p => card(org, p, { assignment: pmAssign(p), note: otherAssignmentNote(p, pmAssign(p)) })).join('')}
        </div>
      </section>
    </div>
    <div class="cols">${cols}</div>
  </div>
</div>`;

  const css = `
.h1s{font-weight:500;color:var(--ink-2);font-size:18px;margin-left:4px}
.legendbar{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:10px 14px;margin-bottom:16px}
.board{position:relative;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:24px 20px 20px;box-shadow:var(--shadow)}
.wires{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}
.wires path{fill:none;stroke:var(--ink-3);stroke-width:1.5}
.gov,.cols{position:relative;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
.gov{margin-bottom:44px;align-items:start}
.unit{justify-self:center;display:flex;flex-direction:column;align-items:center;gap:6px}
.unit.pm{grid-column:2/5}
.ulbl{font-size:11px;font-weight:700;letter-spacing:.08em;color:var(--ink-2);background:var(--surface);padding:0 6px}
.pmrow{display:flex;gap:10px;padding:10px;border:1px dashed var(--line-strong);border-radius:12px;background:var(--surface)}
.card{position:relative;display:flex;gap:10px;align-items:center;background:var(--surface);border:1px solid var(--line);border-left:4px solid var(--c);
  border-radius:10px;padding:8px 10px 8px 10px;min-width:0}
.card.lg{padding:10px 14px}
.card.lg .av{width:48px;height:48px}
.card .meta{min-width:0}
.card .nm{font-weight:700;font-size:14px;white-space:nowrap}
.card .rl{font-size:12px;color:var(--ink-2);line-height:1.35}
.card .cochip{margin-top:2px}
.card .note{margin-top:3px;font-size:10.5px;color:var(--ink-2);background:var(--surface-2);border-radius:4px;padding:1px 5px;display:inline-block}
.col{display:grid;grid-row:span 3;grid-template-rows:subgrid;gap:0;border:1px solid var(--line);border-radius:12px;background:var(--surface);overflow:hidden}
.cols{grid-template-rows:auto 1fr auto}
.colh{background:var(--surface-2);padding:10px 12px;border-bottom:1px solid var(--line)}
.colt{display:flex;align-items:baseline;gap:8px}
.num{font-size:11px;font-weight:700;color:var(--ink-3);font-variant-numeric:tabular-nums}
.dn{font-size:16px;font-weight:700}
.cnt{margin-left:auto;font-size:12px;color:var(--ink-2)}
.mix{display:flex;height:4px;border-radius:2px;overflow:hidden;gap:2px;margin-top:8px}
.mixnames{display:flex;flex-wrap:wrap;gap:2px 10px;margin-top:5px}
.colm{padding:14px 12px}
.colr{border-top:1px solid var(--line);padding:10px 12px 12px}
.lbl{font-size:11px;font-weight:700;color:var(--ink-3);letter-spacing:.08em;margin-bottom:4px}
.colr ul{list-style:none;margin:0;padding:0}
.colr li{font-size:12.5px;color:var(--ink);padding:3px 0 3px 16px;position:relative;line-height:1.45}
.colr li::before{content:"";position:absolute;left:3px;top:10px;width:6px;height:6px;border-radius:1px;background:var(--line-strong)}
/* indented tree connectors */
.tree{list-style:none;margin:0;padding:0}
.tree ul{list-style:none;margin:0;padding:0 0 0 18px}
.tree li{position:relative}
.tree.root>li+li{margin-top:10px}
.tree ul>li{padding:10px 0 0 16px}
.tree ul>li::before{content:"";position:absolute;left:0;top:0;width:14px;height:44px;border-left:1.5px solid var(--line-strong);border-bottom:1.5px solid var(--line-strong);border-bottom-left-radius:8px}
.tree ul>li:not(:last-child)::after{content:"";position:absolute;left:0;top:0;bottom:0;border-left:1.5px solid var(--line-strong)}
@media (max-width:980px){
  .gov,.cols{grid-template-columns:repeat(2,minmax(0,1fr))}
  .unit.pm{grid-column:2/3}
  .wires{display:none}
  .gov{margin-bottom:20px}
}
@media (max-width:620px){
  .gov,.cols{grid-template-columns:1fr}
  .unit.pm{grid-column:auto}
  .pmrow{flex-direction:column}
}
@media print{@page{size:A4 landscape;margin:8mm}.page{padding:0;max-width:none}.board{box-shadow:none}}
`;

  const js = `
(function(){
  var board=document.getElementById('board'), svg=document.getElementById('wires');
  function box(el){var b=board.getBoundingClientRect(),r=el.getBoundingClientRect();
    return {l:r.left-b.left,r:r.right-b.left,t:r.top-b.top,b:r.bottom-b.top,cx:(r.left+r.right)/2-b.left,cy:(r.top+r.bottom)/2-b.top};}
  function elbow(x1,y1,x2,y2,midY){var m=midY==null?(y1+y2)/2:midY; var rr=8;
    if(Math.abs(x1-x2)<1) return 'M'+x1+','+y1+'V'+y2;
    var s=x2>x1?1:-1; return 'M'+x1+','+y1+'V'+(m-rr)+'Q'+x1+','+m+' '+(x1+s*rr)+','+m+'H'+(x2-s*rr)+'Q'+x2+','+m+' '+x2+','+(m+rr)+'V'+y2;}
  function draw(){
    if(getComputedStyle(svg).display==='none') return;
    var o=box(document.querySelector('#u-owner .card')), pm=box(document.querySelector('#u-pm .pmrow'));
    var d=[];
    var h0=box(document.getElementById('dh-0'));
    d.push(elbow(o.cx,o.b,h0.cx,h0.t));
    // owner -> PM
    d.push('M'+o.r+','+o.cy+'H'+(pm.l-2));
    var hs=[1,2,3].map(function(i){return document.getElementById('dh-'+i);}).filter(Boolean).map(box);
    var busY=(pm.b+hs[0].t)/2;
    hs.forEach(function(h){d.push(elbow(pm.cx,pm.b,h.cx,h.t,busY));});
    svg.innerHTML=d.map(function(p){return '<path d="'+p+'"/>';}).join('');
  }
  addEventListener('resize',draw); addEventListener('load',draw); document.fonts&&document.fonts.ready.then(draw); draw();
})();`;

  return page({
    title: '体制図 クリーンツリー',
    description: '所属会社を色、チームを列で表したクリーンな階層型プロジェクト体制図。',
    css,
    body,
    js,
  });
}
