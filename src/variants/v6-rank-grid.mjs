// Variant 6: Rank-aligned grid. Top-down tiers (owner → PM → leads → members) × team columns,
// so people of the same standing always sit at the same height.
import { esc, page, legendHtml, company } from './shared.mjs';

const RANKS = ['オーナー', '統括・PM', '主担当', 'メンバー', 'サブメンバー'];

function card(org, p, a, col) {
  const c = company(org, p);
  const other = p.assignments.find(x => x !== a);
  return `<div class="card" data-id="${p.id}" data-parent="${p.parent || ''}" data-col="${col}" style="--c:${c.color}">
    <img class="av" src="${p.avatar}" alt="">
    <div class="m">
      <div class="nm">${esc(p.name)}${a.badge ? ` <span class="tag${a.badge === '主担当' ? '' : ' soft'}">${esc(a.badge)}</span>` : ''}</div>
      <div class="rl">${esc(a.role)}</div>
      <div class="cochip">${esc(c.short)}</div>
      ${other ? `<div class="note">兼 ${esc(other.unit === org.pmTitle ? 'PM' : other.unit)} ${esc(other.badge)}</div>` : ''}
    </div>
  </div>`;
}

export function buildRankGrid(org) {
  const P = org.people;
  // cells[rank][deptIndex] = [{p, a}]
  const cells = RANKS.map(() => org.depts.map(() => []));
  org.depts.forEach(d => {
    const inDept = new Set(d.memberIds);
    const depth = id => { let n = 0, p = P.get(id); while (p.parent && inDept.has(p.parent)) { n++; p = P.get(p.parent); } return n; };
    d.memberIds.forEach(id => {
      const p = P.get(id);
      const rank = Math.min(2 + depth(id), RANKS.length - 1);
      cells[rank][d.index].push({ p, a: p.assignments.find(a => a.deptIndex === d.index) });
    });
  });
  const usedRanks = RANKS.map((_, r) => r < 2 || cells[r].some(c => c.length));

  // PM spans the teams whose leads report to the PM lead.
  const pmCols = org.depts.filter(d => d.memberIds.some(id => P.get(id).parent === org.pmLeadId)).map(d => d.index);
  const pmFrom = Math.min(...pmCols) + 2, pmTo = Math.max(...pmCols) + 3;
  const weights = org.depts.map(d => Math.max(1, ...cells.map(r => r[d.index].length)));

  const owner = P.get(org.ownerId);
  const pmPeople = [org.pmLeadId, ...org.pmMemberIds].map(id => P.get(id));
  const pmA = p => p.assignments.find(a => a.unit === org.pmTitle);

  let rows = `<div class="corner"></div>${org.depts.map(d => `<div class="colh"><span class="num">${String(d.index + 1).padStart(2, '0')}</span>${esc(d.name)}<span class="cnt">${d.memberIds.length}名</span></div>`).join('')}`;
  let rowNo = 2;
  RANKS.forEach((label, r) => {
    if (!usedRanks[r]) return;
    const band = `band${rowNo % 2}`;
    rows += `<div class="rlab ${band}" style="grid-row:${rowNo}"><span>L${r}</span>${esc(label)}</div>`;
    if (r === 0) {
      rows += `<div class="cell ${band} span" style="grid-row:${rowNo};grid-column:2/-1">${card(org, owner, owner.primary, 'gov')}</div>`;
    } else if (r === 1) {
      for (let c = 2; c < org.depts.length + 2; c++) {
        if (c === pmFrom) {
          rows += `<div class="cell ${band} span" style="grid-row:${rowNo};grid-column:${pmFrom}/${pmTo}"><div class="pmbox"><div class="pml">${esc(org.pmTitle)}</div><div class="pmrow">${pmPeople.map(p => card(org, p, pmA(p), 'pm')).join('')}</div></div></div>`;
          c = pmTo - 1;
        } else rows += `<div class="cell ${band}" style="grid-row:${rowNo};grid-column:${c}"></div>`;
      }
    } else {
      org.depts.forEach(d => {
        rows += `<div class="cell ${band}" style="grid-row:${rowNo};grid-column:${d.index + 2}">${cells[r][d.index].map(({ p, a }) => card(org, p, a, d.index)).join('')}</div>`;
      });
    }
    rowNo++;
  });
  rows += `<div class="rlab roles" style="grid-row:${rowNo}">担当業務</div>${org.depts
    .map(d => `<div class="cell roles" style="grid-row:${rowNo};grid-column:${d.index + 2}"><ul>${d.roles.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`)
    .join('')}`;

  const body = `<div class="page">
  <div class="topbar">
    <div>
      <div class="eyebrow">Rank-aligned Grid · ${esc(org.date)}</div>
      <h1>${esc(org.title)} <span class="h1s">階層そろえ体制図</span></h1>
      <p class="sub">上から「オーナー → 統括 → 主担当 → メンバー」。同じ立場の人は常に同じ高さに並びます</p>
    </div>
    <div class="tools"><button class="btn" onclick="print()">印刷 / PDF</button><button class="btn" id="themeBtn"></button></div>
  </div>
  <div class="legendbar">${legendHtml(org)}</div>
  <div class="scroller"><div class="grid" id="grid" style="min-width:${96 + weights.reduce((n, w) => n + w * 214 + 12, 0)}px;grid-template-columns:96px ${weights.map(w => `minmax(${w * 214 + 12}px,${w}fr)`).join(' ')}">
    <svg class="wires" id="wires" aria-hidden="true"></svg>
    ${rows}
  </div></div>
</div>`;

  const css = `
.h1s{font-weight:500;color:var(--ink-2);font-size:18px;margin-left:4px}
.legendbar{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:10px 14px;margin-bottom:16px}
.scroller{overflow-x:auto;background:var(--surface);border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow)}
.grid{position:relative;display:grid}
.wires{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:1}
.wires path{fill:none;stroke:var(--ink-3);stroke-width:1.5}
.corner{grid-row:1;grid-column:1;border-bottom:1px solid var(--line)}
.colh{grid-row:1;padding:12px 14px;font-weight:700;font-size:15px;display:flex;gap:8px;align-items:baseline;border-bottom:1px solid var(--line);border-left:1px solid var(--line)}
.num{font-size:11px;color:var(--ink-3)}
.cnt{margin-left:auto;font-size:12px;font-weight:400;color:var(--ink-2)}
.rlab{grid-column:1;padding:14px 12px;font-size:12px;font-weight:700;color:var(--ink-2);display:flex;flex-direction:column;justify-content:center;border-bottom:1px solid var(--line)}
.rlab span{font-size:10px;color:var(--ink-3);letter-spacing:.1em}
.cell{display:flex;gap:14px;justify-content:center;align-items:flex-start;padding:22px 12px;border-bottom:1px solid var(--line);border-left:1px solid var(--line)}
.cell.span{justify-content:center}
.band0{background:var(--surface-2)}
.band1{background:var(--surface)}
.card{position:relative;z-index:2;display:flex;gap:10px;align-items:center;background:var(--surface);border:1px solid var(--line-strong);border-left:4px solid var(--c);
  border-radius:10px;padding:8px 12px 8px 10px;width:200px}
.cell.span .card{width:auto;min-width:200px}
.card .m{min-width:0}
.card .nm{font-weight:700;font-size:14px;white-space:nowrap}
.card .rl{font-size:12px;color:var(--ink-2);line-height:1.35}
.card .note{margin-top:3px;font-size:10.5px;font-weight:700;background:var(--ink);color:var(--surface);border-radius:4px;padding:1px 6px;display:inline-block}
.pmbox{position:relative;z-index:2;border:1px dashed var(--line-strong);border-radius:12px;padding:6px 10px 10px;background:var(--surface)}
.pml{font-size:10.5px;font-weight:700;color:var(--ink-3);letter-spacing:.06em;margin-bottom:6px;text-align:center}
.pmrow{display:flex;gap:10px}
.roles{background:var(--surface-2);border-bottom:0}
.cell.roles{display:block;padding:12px 14px}
.cell.roles ul{margin:0;padding-left:16px;font-size:12px;color:var(--ink-2);line-height:1.7}
@media print{@page{size:A4 landscape;margin:8mm}.page{padding:0;max-width:none}.scroller{box-shadow:none;overflow:visible}}
`;

  const js = `
(function(){
  var grid=document.getElementById('grid'), svg=document.getElementById('wires');
  function box(el){var g=grid.getBoundingClientRect(),r=el.getBoundingClientRect();return {l:r.left-g.left,r:r.right-g.left,t:r.top-g.top,b:r.bottom-g.top,cx:(r.left+r.right)/2-g.left,cy:(r.top+r.bottom)/2-g.top};}
  function elbow(a,b){var x1=a.cx,y1=a.b,x2=b.cx,y2=b.t,m=y1+16,r=8;
    if(Math.abs(x1-x2)<1) return 'M'+x1+','+y1+'V'+y2;
    var s=x2>x1?1:-1; return 'M'+x1+','+y1+'V'+(m-r)+'Q'+x1+','+m+' '+(x1+s*r)+','+m+'H'+(x2-s*r)+'Q'+x2+','+m+' '+x2+','+(m+r)+'V'+y2;}
  function draw(){
    var cards=[].slice.call(grid.querySelectorAll('.card')), out=[];
    cards.forEach(function(c){
      var pid=c.dataset.parent; if(!pid) return;
      if(c.dataset.col==='pm'&&c.dataset.id!==${JSON.stringify(org.pmLeadId)}) return; // PM staff sit beside the lead
      var cands=cards.filter(function(x){return x.dataset.id===pid;});
      var par=cands.find(function(x){return x.dataset.col===c.dataset.col;})||cands.find(function(x){return x.dataset.col==='pm';})||cands[0];
      if(!par) return;
      var src=par.dataset.col==='pm'?par.closest('.pmbox'):par, dst=c.dataset.col==='pm'?c.closest('.pmbox'):c;
      out.push('<path d="'+elbow(box(src),box(dst))+'"/>');
    });
    svg.innerHTML=out.join('');
  }
  addEventListener('resize',draw); addEventListener('load',draw); document.fonts&&document.fonts.ready.then(draw); draw();
})();`;

  return page({ title: '階層そろえ体制図', description: 'オーナー→統括→主担当→メンバーの階層を横一列に揃え、チームを列にした上から下への体制図。', css, body, js });
}
