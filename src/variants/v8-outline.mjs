// Variant 8: Vertical outline. One column, top-down, collapsible — built for phones, Slack and Notion embeds.
import { esc, page, legendHtml, company } from './shared.mjs';

export function buildOutline(org) {
  const P = org.people;
  const descendants = id => P.get(id).children.reduce((n, k) => n + 1 + descendants(k), 0);

  const node = id => {
    const p = P.get(id), c = company(org, p), a = p.primary;
    const other = p.assignments.find(x => x !== a);
    const dept = a.deptIndex >= 0 ? org.depts[a.deptIndex] : null;
    const leadsTeam = dept && !dept.memberIds.includes(p.parent);
    const isPm = id === org.pmLeadId;
    const unit = a.deptIndex < 0 ? (a.unit === org.pmTitle ? 'PM' : 'オーナー') : a.unit;
    const head = leadsTeam
      ? `<div class="team"><b>${esc(dept.name)}</b><span>${dept.memberIds.length}名</span></div>`
      : isPm ? `<div class="team pm"><b>${esc(org.pmTitle)}</b></div>` : '';
    const cardHtml = `<div class="card" style="--c:${c.color}">
      <img class="av" src="${p.avatar}" alt="">
      <div class="m">
        <div class="nm">${esc(p.name)}${a.badge ? ` <span class="tag${a.badge === '主担当' ? '' : ' soft'}">${esc(a.badge)}</span>` : ''}</div>
        <div class="rl">${esc(unit)} ／ ${esc(a.role)}</div>
        <div class="cochip">${esc(c.short)}</div>
        ${other ? `<div class="note">兼 ${esc(other.unit)}${other.badge ? `（${esc(other.badge)}）` : ''}：${esc(other.role)}</div>` : ''}
      </div>
      ${p.children.length ? `<span class="cnt">配下 ${descendants(id)}名<i aria-hidden="true"></i></span>` : ''}
    </div>`;
    const roles = leadsTeam ? `<details class="roles"><summary>担当業務（${dept.roles.length}）</summary><ul>${dept.roles.map(r => `<li>${esc(r)}</li>`).join('')}</ul></details>` : '';
    if (!p.children.length) return `<li>${head}${cardHtml}${roles}</li>`;
    return `<li>${head}<details class="grp" open><summary>${cardHtml}</summary>${roles}<ol>${p.children.map(node).join('')}</ol></details></li>`;
  };

  const body = `<div class="page narrow">
  <div class="topbar">
    <div>
      <div class="eyebrow">Vertical Outline · ${esc(org.date)}</div>
      <h1>${esc(org.title)}<br><span class="h1s">体制アウトライン</span></h1>
      <p class="sub">上から下へスクロールするだけ。カードをタップすると配下を開閉できます</p>
    </div>
  </div>
  <div class="bar">
    <button class="btn" id="openAll">すべて開く</button><button class="btn" id="closeAll">主担当まで</button><button class="btn" id="themeBtn"></button>
  </div>
  <div class="legendbar">${legendHtml(org)}</div>
  <ol class="otree root">${node(org.ownerId)}</ol>
</div>`;

  const css = `
.page.narrow{max-width:680px}
.h1s{font-weight:500;color:var(--ink-2);font-size:17px}
.bar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.legendbar{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:10px 14px;margin-bottom:18px}
.otree,.otree ol{list-style:none;margin:0;padding:0}
.otree ol{margin-left:22px;padding-left:18px;border-left:1.5px solid var(--line-strong)}
.otree ol>li{position:relative;padding-top:12px}
.otree ol>li::before{content:"";position:absolute;left:-18px;top:53px;width:16px;border-top:1.5px solid var(--line-strong)}
.otree ol>li:last-child::after{content:"";position:absolute;left:-20px;top:54px;bottom:0;width:4px;background:var(--bg)}
.team{display:flex;gap:8px;align-items:baseline;margin:4px 0 6px;padding:5px 10px;border-radius:8px;background:var(--ink);color:var(--surface);width:max-content;max-width:100%}
.team b{font-size:13px}
.team span{font-size:11.5px;opacity:.75}
.team.pm{background:var(--surface-2);color:var(--ink);box-shadow:inset 0 0 0 1px var(--line-strong)}
.otree ol>li:has(> .team)::before{top:91px}
.otree ol>li:has(> .team):last-child::after{top:92px}
.card{position:relative;display:flex;gap:12px;align-items:center;background:var(--surface);border:1px solid var(--line);border-left:5px solid var(--c);
  border-radius:12px;padding:10px 12px;box-shadow:var(--shadow)}
.card .av{width:46px;height:46px}
.card .m{min-width:0;flex:1}
.card .nm{font-weight:700;font-size:15px}
.card .rl{font-size:12.5px;color:var(--ink-2);line-height:1.4}
.card .note{margin-top:4px;font-size:11px;color:var(--ink);background:var(--surface-2);border-radius:6px;padding:2px 7px;display:inline-block}
.cnt{flex:none;display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--ink-2);white-space:nowrap}
.cnt i{width:8px;height:8px;border-right:2px solid var(--ink-3);border-bottom:2px solid var(--ink-3);transform:rotate(45deg) translateY(-2px);transition:transform .15s}
details.grp:not([open]) > summary .cnt i{transform:rotate(-45deg)}
details.grp > summary{list-style:none;cursor:pointer}
details.grp > summary::-webkit-details-marker{display:none}
details.grp > summary:focus-visible .card{outline:2px solid var(--ink);outline-offset:2px}
.roles{margin:6px 0 0 4px;font-size:12.5px;color:var(--ink-2)}
.roles summary{cursor:pointer;font-weight:700;font-size:12px;color:var(--ink-2)}
.roles ul{margin:4px 0 0;padding-left:18px;line-height:1.7}
@media (max-width:480px){.otree ol{margin-left:12px;padding-left:12px}.otree ol>li::before{left:-12px;width:10px}.otree ol>li:last-child::after{left:-14px}.cnt{font-size:10.5px}}
`;

  const js = `
(function(){
  var all=function(){return [].slice.call(document.querySelectorAll('details.grp'));};
  document.getElementById('openAll').onclick=function(){all().forEach(function(d){d.open=true;});};
  // Collapse under team leads only, so owner → PM → leads stays visible.
  document.getElementById('closeAll').onclick=function(){all().forEach(function(d){d.open=!d.parentElement.querySelector(':scope > .team:not(.pm)');});};
})();`;

  return page({ title: '体制アウトライン', description: 'スマホやSlack・Notion埋め込み向けの、上から下へ1列で読める開閉式の体制図。', css, body, js });
}
