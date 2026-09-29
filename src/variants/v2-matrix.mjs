// Variant 2: Company x Team matrix. Answers "which company staffs which team" at a glance.
import { esc, page, company } from './shared.mjs';

function chip(org, p, a) {
  const c = company(org, p);
  const boss = p.parent ? org.people.get(p.parent) : null;
  const dual = p.assignments.find(x => x !== a);
  return `<div class="chip" data-id="${p.id}" data-parent="${p.parent || ''}" style="--c:${c.color}">
    <img class="av" src="${p.avatar}" alt="">
    <div class="cm">
      <div class="nm">${esc(p.name)}${a.badge ? ` <span class="tag${a.badge === '主担当' ? '' : ' soft'}">${esc(a.badge)}</span>` : ''}</div>
      <div class="rl">${esc(a.role)}</div>
      <div class="rep">${boss ? `<span title="レポート先">↑ ${esc(boss.name)}</span>` : '<span>最上位</span>'}${dual ? `<span class="dual">兼 ${esc(dual.unit.replace('プロジェクトマネジメント', 'PM'))}</span>` : ''}</div>
    </div>
  </div>`;
}

export function buildMatrix(org) {
  const govRoles = [...org.people.values()].flatMap(p =>
    p.assignments.filter(a => a.deptIndex < 0).map(a => `${a.unit === org.pmTitle ? 'PM' : 'オーナー'}：${a.role}`)
  );
  const columns = [
    { key: 'gov', name: 'ガバナンス', sub: 'オーナー / PM', match: a => a.deptIndex < 0, roles: govRoles },
    ...org.depts.map(d => ({ key: d.id, name: d.name, sub: `${d.memberIds.length}名`, match: a => a.deptIndex === d.index, roles: d.roles, dept: d })),
  ];

  const cell = (col, c) => {
    const items = [];
    for (const p of org.people.values()) {
      if (p.companyId !== c.id) continue;
      p.assignments.filter(col.match).forEach(a => items.push(chip(org, p, a)));
    }
    return items.length ? items.join('') : '<div class="empty">—</div>';
  };

  const colCompanies = col => {
    const set = new Set();
    for (const p of org.people.values()) if (p.assignments.some(col.match)) set.add(p.companyId);
    return set.size;
  };

  const head = columns
    .map(col => {
      const n = colCompanies(col);
      return `<div class="ch" data-col="${col.key}"><div class="cn">${esc(col.name)}</div><div class="cs">${esc(col.sub)}${n > 1 ? ` <span class="mixed">${n}社混成</span>` : ''}</div></div>`;
    })
    .join('');

  const rows = org.companies
    .map(c => {
      const teams = columns.filter(col => [...org.people.values()].some(p => p.companyId === c.id && p.assignments.some(col.match)));
      return `<div class="rh" style="--c:${c.color}">
        <div class="rn">${esc(c.short)}</div>
        <div class="rt">${esc(c.tag)}</div>
        <div class="rc"><b>${c.count}</b>名 · ${teams.length}チーム</div>
      </div>${columns.map(col => `<div class="cell" style="--c:${c.color}">${cell(col, c)}</div>`).join('')}`;
    })
    .join('');

  const foot = `<div class="rh foot"><div class="rn">担当業務</div></div>${columns
    .map(col => `<div class="cell foot"><ul>${col.roles.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>`)
    .join('')}`;

  // Auto-derived observations shown above the matrix.
  const insights = [];
  org.depts.forEach(d => {
    const cs = [...new Set(d.memberIds.map(id => company(org, org.people.get(id)).short))];
    if (cs.length > 1) insights.push(`<b>${esc(d.name)}</b>は ${cs.map(esc).join(' × ')} の${cs.length}社混成チーム`);
  });
  for (const p of org.people.values())
    if (p.dual) insights.push(`<b>${esc(p.name)}</b>は ${p.assignments.map(a => esc(a.unit) + (a.badge ? `（${esc(a.badge)}）` : '')).join(' と ')} を兼務`);
  const ownerCo = company(org, org.people.get(org.ownerId));
  const pmCo = company(org, org.people.get(org.pmLeadId));
  insights.push(`意思決定は <b>${esc(ownerCo.short)}</b>、実行統括は <b>${esc(pmCo.short)}</b>`);

  const body = `<div class="page">
  <div class="topbar">
    <div>
      <div class="eyebrow">Company × Team Matrix · ${esc(org.date)}</div>
      <h1>${esc(org.title)} <span class="h1s">体制マトリクス</span></h1>
      <p class="sub">行＝所属会社、列＝チーム。誰がどの会社からどのチームに入っているかを一目で確認できます</p>
    </div>
    <div class="tools"><button class="btn" onclick="print()">印刷 / PDF</button><button class="btn" id="themeBtn"></button></div>
  </div>
  <div class="kpis">
    <div class="kpi"><b>${org.companies.length}</b><span>参画企業</span></div>
    <div class="kpi"><b>${org.people.size}</b><span>メンバー</span></div>
    <div class="kpi"><b>${org.depts.length}</b><span>チーム</span></div>
    <ul class="insights">${insights.map(i => `<li>${i}</li>`).join('')}</ul>
  </div>
  <div class="scroller">
    <div class="grid" style="--cols:${columns.length}">
      <div class="corner"><span>会社 ＼ チーム</span></div>${head}
      ${rows}
      ${foot}
    </div>
  </div>
  <p class="hint">カードにカーソルを合わせると、上長・部下・兼務先がハイライトされます</p>
</div>`;

  const css = `
.h1s{font-weight:500;color:var(--ink-2);font-size:18px;margin-left:4px}
.kpis{display:flex;gap:12px;align-items:stretch;flex-wrap:wrap;margin-bottom:16px}
.kpi{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:10px 18px;display:flex;flex-direction:column;justify-content:center;min-width:96px}
.kpi b{font-size:26px;line-height:1.1;font-variant-numeric:tabular-nums}
.kpi span{font-size:11px;color:var(--ink-2)}
.insights{flex:1;min-width:280px;margin:0;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:10px 16px 10px 32px;font-size:12.5px;color:var(--ink-2);display:flex;flex-direction:column;justify-content:center;gap:2px}
.insights b{color:var(--ink)}
.scroller{overflow-x:auto;border-radius:14px;border:1px solid var(--line);background:var(--surface);box-shadow:var(--shadow)}
.grid{display:grid;grid-template-columns:168px repeat(var(--cols),minmax(190px,1fr));min-width:1100px}
.grid>div{border-right:1px solid var(--line);border-bottom:1px solid var(--line)}
.corner{display:flex;align-items:flex-end;padding:12px;font-size:11px;color:var(--ink-3);background:var(--surface-2)}
.ch{padding:12px;background:var(--surface-2)}
.cn{font-weight:700;font-size:15px}
.cs{font-size:11.5px;color:var(--ink-2)}
.mixed{display:inline-block;margin-left:4px;font-size:10px;font-weight:700;padding:1px 6px;border-radius:999px;background:var(--ink);color:var(--surface)}
.rh{padding:14px 12px 14px 16px;position:relative;background:color-mix(in srgb,var(--c) 7%,var(--surface))}
.rh::before{content:"";position:absolute;left:0;top:0;bottom:0;width:5px;background:var(--c)}
.rn{font-weight:700;font-size:14px}
.rt{font-size:11.5px;color:var(--ink-2)}
.rc{font-size:11.5px;color:var(--ink-2);margin-top:6px}
.rc b{font-size:16px;color:var(--ink)}
.cell{padding:8px;display:flex;flex-direction:column;gap:6px;background:var(--surface);transition:background .15s}
.empty{flex:1;display:grid;place-items:center;color:var(--line-strong);font-size:18px;min-height:40px}
.chip{display:flex;gap:9px;align-items:flex-start;padding:8px 9px;border-radius:10px;border:1px solid var(--line);
  background:color-mix(in srgb,var(--c) 6%,var(--surface));transition:opacity .15s,box-shadow .15s,transform .15s;cursor:default}
.chip .av{width:34px;height:34px;margin-top:2px}
.cm{min-width:0}
.chip .nm{font-weight:700;font-size:13px;white-space:nowrap}
.chip .rl{font-size:11.5px;color:var(--ink-2);line-height:1.35}
.rep{display:flex;flex-wrap:wrap;gap:2px 8px;font-size:10.5px;color:var(--ink-3);margin-top:2px}
.dual{color:var(--ink);font-weight:700}
.foot{background:var(--surface-2)!important}
.cell.foot ul{margin:0;padding:0 0 0 14px;font-size:11.5px;color:var(--ink-2);line-height:1.6}
.rh.foot::before{display:none}
.hint{font-size:11.5px;color:var(--ink-3);margin:10px 2px 0}
.grid.focus .chip{opacity:.28}
.grid.focus .chip.hi{opacity:1;box-shadow:0 0 0 2px var(--c)}
.grid.focus .chip.self{opacity:1;box-shadow:0 0 0 2px var(--ink);transform:translateY(-1px)}
@media print{@page{size:A4 landscape;margin:8mm}.page{padding:0;max-width:none}.scroller{box-shadow:none;overflow:visible}.grid{min-width:0}}
`;

  const js = `
(function(){
  var grid=document.querySelector('.grid');
  function chips(){return Array.prototype.slice.call(grid.querySelectorAll('.chip'));}
  grid.addEventListener('mouseover',function(e){
    var c=e.target.closest('.chip'); if(!c) return;
    var id=c.dataset.id, parent=c.dataset.parent;
    grid.classList.add('focus');
    chips().forEach(function(x){
      x.classList.toggle('self',x.dataset.id===id);
      x.classList.toggle('hi',x.dataset.id===parent||x.dataset.parent===id);
    });
  });
  grid.addEventListener('mouseleave',function(){grid.classList.remove('focus');chips().forEach(function(x){x.classList.remove('self','hi');});});
})();`;

  return page({
    title: '体制マトリクス',
    description: '所属会社×チームのマトリクスで、マルチベンダ体制の構成を一目で把握できる体制図。',
    css,
    body,
    js,
  });
}
