// Variant 4: Radial map. Owner at the center, reporting depth = distance, teams = sectors.
import { esc, page, legendHtml, company, toClientJson } from './shared.mjs';

const SIZE = 1240;
const C = SIZE / 2;
const RADII = [0, 165, 295, 410, 520];
const SECTOR = { inner: 228, outer: 572, label: 588 };
const rad = deg => (deg * Math.PI) / 180;
const polar = (deg, r) => [C + r * Math.cos(rad(deg)), C + r * Math.sin(rad(deg))];
const f = n => n.toFixed(1);

function arcPath(a0, a1, r0, r1) {
  const large = a1 - a0 > 180 ? 1 : 0;
  const [x0, y0] = polar(a0, r1), [x1, y1] = polar(a1, r1), [x2, y2] = polar(a1, r0), [x3, y3] = polar(a0, r0);
  return `M${f(x0)},${f(y0)}A${r1},${r1} 0 ${large} 1 ${f(x1)},${f(y1)}L${f(x2)},${f(y2)}A${r0},${r0} 0 ${large} 0 ${f(x3)},${f(y3)}Z`;
}

export function buildRadial(org) {
  const P = org.people;
  // Every team member gets its own angular slot (DFS order), so no two people share a ray.
  // People outside teams (owner, PM) sit at the midpoint of their reports.
  const order = [];
  (function walk(id) {
    order.push(P.get(id));
    P.get(id).children.forEach(walk);
  })(org.ownerId);
  const GAP = 0.8;
  let slot = 0, prevDept = null;
  const slotOf = new Map();
  for (const p of order) {
    if (p.deptIndex < 0) continue;
    if (prevDept !== null && p.deptIndex !== prevDept) slot += GAP;
    slotOf.set(p.id, slot);
    slot += 1;
    prevDept = p.deptIndex;
  }
  const total = slot + GAP; // includes the wrap-around gap
  const START = -90 - ((slot - 1) / 2 / total) * 360; // center the fan at the top
  const pos = new Map();
  (function lay(id, depth) {
    const p = P.get(id);
    p.children.forEach(k => lay(k, depth + 1));
    let angle = -90;
    if (slotOf.has(id)) angle = START + (slotOf.get(id) / total) * 360;
    else if (p.children.length) {
      const as = p.children.map(k => pos.get(k).angle);
      angle = (Math.min(...as) + Math.max(...as)) / 2;
    }
    pos.set(id, { angle, depth, r: RADII[Math.min(depth, RADII.length - 1)] });
  })(org.ownerId, 0);

  // Team sectors.
  const halfSlot = (360 / total) * 0.5;
  const sectors = org.depts
    .map(d => {
      const as = d.memberIds.map(id => pos.get(id).angle);
      const a0 = Math.min(...as) - halfSlot, a1 = Math.max(...as) + halfSlot;
      const labelR = SECTOR.label;
      const mid = (a0 + a1) / 2;
      // Flip label direction on the lower half so text is never upside-down.
      const lower = Math.sin(rad(mid)) > 0.15;
      const [lx0, ly0] = polar(lower ? a1 : a0, labelR), [lx1, ly1] = polar(lower ? a0 : a1, labelR);
      const large = a1 - a0 > 180 ? 1 : 0;
      return `<g class="sector">
        <path class="wedge" d="${arcPath(a0, a1, SECTOR.inner, SECTOR.outer)}"/>
        <path id="sl-${d.index}" d="M${f(lx0)},${f(ly0)}A${labelR},${labelR} 0 ${large} ${lower ? 0 : 1} ${f(lx1)},${f(ly1)}" fill="none"/>
        <text class="slabel" dy="${lower ? 12 : 0}"><textPath href="#sl-${d.index}" startOffset="50%" text-anchor="middle">${String(d.index + 1).padStart(2, '0')}  ${esc(d.name)} · ${d.memberIds.length}名</textPath></text>
      </g>`;
    })
    .join('');

  const links = [...P.values()]
    .filter(p => p.parent && pos.has(p.parent))
    .map(p => {
      const a = pos.get(p.parent), b = pos.get(p.id);
      const [x0, y0] = polar(a.angle, a.r), [x1, y1] = polar(b.angle, b.r);
      if (a.r === 0) return `<path data-from="${p.parent}" data-to="${p.id}" d="M${f(x0)},${f(y0)}L${f(x1)},${f(y1)}"/>`;
      const rm = (a.r + b.r) / 2;
      const [c0x, c0y] = polar(a.angle, rm), [c1x, c1y] = polar(b.angle, rm);
      return `<path data-from="${p.parent}" data-to="${p.id}" d="M${f(x0)},${f(y0)}C${f(c0x)},${f(c0y)} ${f(c1x)},${f(c1y)} ${f(x1)},${f(y1)}"/>`;
    })
    .join('');

  const nodes = [...pos]
    .map(([id, { angle, r, depth }]) => {
      const p = P.get(id), c = company(org, p);
      const [x, y] = polar(angle, r);
      const nr = depth === 0 ? 52 : depth === 1 ? 38 : 32;
      const a = p.primary;
      const extra = p.dual ? p.assignments.find(x => x !== a) : null;
      return `<g class="node" data-id="${id}" tabindex="0" transform="translate(${f(x)},${f(y)})" style="--c:${c.color}">
        <clipPath id="cp-${id}"><circle r="${nr}"/></clipPath>
        <circle class="ring" r="${nr + 4}"/>
        <image href="${p.avatar}" x="${-nr}" y="${-nr}" width="${nr * 2}" height="${nr * 2}" clip-path="url(#cp-${id})" preserveAspectRatio="xMidYMid slice"/>
        <text class="nm" y="${nr + 22}">${esc(p.name)}</text>
        <text class="rl" y="${nr + 39}">${esc(a.badge ? a.badge + ' · ' : '')}${esc(a.role)}</text>
        ${extra ? `<text class="rl dual" y="${nr + 55}">兼 ${esc(extra.unit === org.pmTitle ? 'PM' : extra.unit)} ${esc(extra.badge)}</text>` : ''}
      </g>`;
    })
    .join('');

  const rings = RADII.slice(1, -1).map(r => `<circle class="orbit" cx="${C}" cy="${C}" r="${r}"/>`).join('');

  const svg = `<svg class="radial" viewBox="0 0 ${SIZE} ${SIZE}" role="img" aria-label="${esc(org.title)} 放射型体制図">
    ${sectors}${rings}<g class="links">${links}</g>${nodes}
  </svg>`;

  const deptList = org.depts
    .map(d => `<details><summary><span class="num">${String(d.index + 1).padStart(2, '0')}</span>${esc(d.name)}<span class="cnt">${d.memberIds.length}名</span></summary><ul>${d.roles.map(r => `<li>${esc(r)}</li>`).join('')}</ul></details>`)
    .join('');

  const body = `<div class="page">
  <div class="topbar">
    <div>
      <div class="eyebrow">Radial Command Map · ${esc(org.date)}</div>
      <h1>${esc(org.title)} <span class="h1s">放射型体制図</span></h1>
      <p class="sub">中心＝オーナー、外側ほど現場。扇形がチーム、アバターの輪の色が所属会社です</p>
    </div>
    <div class="tools"><button class="btn" id="themeBtn"></button></div>
  </div>
  <div class="layout">
    <div class="stage">${svg}</div>
    <aside class="side">
      <section class="box"><h2>所属会社</h2>${legendHtml(org)}</section>
      <section class="box focus" id="focus"><h2>フォーカス</h2><p class="muted">人物にカーソルを合わせる（タップする）と、オーナーまでの指揮系統が表示されます</p></section>
      <section class="box"><h2>チームと担当業務</h2>${deptList}</section>
    </aside>
  </div>
</div>`;

  const css = `
.h1s{font-weight:500;color:var(--ink-2);font-size:18px;margin-left:4px}
.layout{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:16px;align-items:start}
.stage{background:var(--surface);border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow);padding:8px}
.radial{display:block;width:100%;height:auto;max-height:86vh}
.wedge{fill:var(--surface-2);stroke:var(--line);stroke-width:1}
.slabel{font-size:17px;font-weight:700;fill:var(--ink-2);letter-spacing:.06em}
.orbit{fill:none;stroke:var(--line);stroke-dasharray:3 5}
.links path{fill:none;stroke:var(--ink-3);stroke-width:1.6;transition:stroke .15s,opacity .15s}
.node{cursor:pointer;outline:none;transition:opacity .15s}
.node .ring{fill:var(--surface);stroke:var(--c);stroke-width:3}
.node text{text-anchor:middle;paint-order:stroke;stroke:var(--surface);stroke-width:5px;stroke-linejoin:round}
.node .nm{font-size:16px;font-weight:700;fill:var(--ink)}
.node .rl{font-size:12.5px;fill:var(--ink-2)}
.node .dual{font-weight:700;fill:var(--ink)}
.node:focus-visible .ring{stroke-width:5}
.radial.dim .node{opacity:.25}
.radial.dim .node.on{opacity:1}
.radial.dim .links path{opacity:.2}
.radial.dim .links path.on{opacity:1;stroke:var(--ink);stroke-width:2.6}
.side{display:flex;flex-direction:column;gap:12px}
.box{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px 16px}
.box h2{font-size:11px;letter-spacing:.1em;color:var(--ink-3);margin:0 0 8px;font-weight:700}
.box .legend{flex-direction:column;gap:6px}
.muted{font-size:12.5px;color:var(--ink-2);margin:0;line-height:1.6}
details{border-top:1px solid var(--line);padding:6px 0}
details:first-of-type{border-top:0}
summary{cursor:pointer;font-weight:700;font-size:13.5px;display:flex;gap:8px;align-items:baseline;list-style:none}
summary::-webkit-details-marker{display:none}
summary::after{content:"＋";margin-left:6px;color:var(--ink-3);font-weight:400}
details[open] summary::after{content:"－"}
.num{font-size:11px;color:var(--ink-3)}
.cnt{margin-left:auto;font-weight:400;font-size:12px;color:var(--ink-2)}
details ul{margin:6px 0 2px;padding-left:18px;font-size:12.5px;color:var(--ink-2);line-height:1.7}
.chain{list-style:none;margin:0;padding:0}
.chain li{display:flex;gap:10px;align-items:center;padding:5px 0;position:relative}
.chain li+li::before{content:"";position:absolute;left:15px;top:-8px;height:12px;border-left:2px solid var(--line-strong)}
.chain .av{width:30px;height:30px;box-shadow:0 0 0 2px var(--surface),0 0 0 3px var(--c)}
.chain b{display:block;font-size:13px}
.chain small{color:var(--ink-2);font-size:11.5px}
.chain li:last-child b{font-size:15px}
@media (max-width:980px){.layout{grid-template-columns:1fr}.radial{max-height:none}}
`;

  const js = `
(function(){
  var D=${toClientJson(org)}, P=D.people;
  var svg=document.querySelector('.radial'), focus=document.getElementById('focus');
  var idle=focus.innerHTML;
  function co(p){return D.companies.find(function(c){return c.id===p.companyId;});}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function chain(id){var out=[id];var p=P[id];while(p&&p.parent){out.unshift(p.parent);p=P[p.parent];}return out;}
  function show(id){
    var ch=chain(id), on=new Set(ch.concat(P[id].children));
    svg.classList.add('dim');
    svg.querySelectorAll('.node').forEach(function(n){n.classList.toggle('on',on.has(n.dataset.id));});
    svg.querySelectorAll('.links path').forEach(function(l){l.classList.toggle('on',on.has(l.dataset.from)&&on.has(l.dataset.to)&&(ch.indexOf(l.dataset.to)>=0||l.dataset.from===id));});
    focus.innerHTML='<h2>指揮系統</h2><ul class="chain">'+ch.map(function(i){var p=P[i],c=co(p);
      return '<li style="--c:'+c.color+'"><img class="av" src="'+p.avatar+'" alt=""><span><b>'+esc(p.name)+'</b><small>'+esc(p.assignments.map(function(a){return a.unit+(a.badge?'（'+a.badge+'）':'');}).join(' / '))+' · '+esc(c.short)+'</small></span></li>';}).join('')+'</ul>'+
      (P[id].children.length?'<p class="muted" style="margin-top:8px">直属メンバー：'+P[id].children.map(function(k){return esc(P[k].name);}).join('、')+'</p>':'');
  }
  function clear(){svg.classList.remove('dim');svg.querySelectorAll('.on').forEach(function(n){n.classList.remove('on');});focus.innerHTML=idle;}
  svg.querySelectorAll('.node').forEach(function(n){
    n.addEventListener('mouseenter',function(){show(n.dataset.id);});
    n.addEventListener('focus',function(){show(n.dataset.id);});
    n.addEventListener('click',function(e){e.stopPropagation();show(n.dataset.id);});
  });
  svg.addEventListener('mouseleave',clear); svg.addEventListener('click',clear);
})();`;

  return page({
    title: '放射型体制図',
    description: 'オーナーを中心に、指揮系統の深さを距離、チームを扇形で表した放射型の体制図。',
    css,
    body,
    js,
  });
}
