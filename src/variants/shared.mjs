// Shared data model + page shell for the alternative chart variants.
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' };

export const esc = s =>
  String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function initialsAvatar(name, color) {
  const initial = String(name).trim().charAt(0) || '?';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="${color}"/><text x="40" y="52" font-size="34" font-family="sans-serif" font-weight="700" fill="#fff" text-anchor="middle">${esc(initial)}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function resolveAvatar(ref, configDir, rootDir) {
  if (!ref) return null;
  const candidates = [
    path.resolve(configDir, ref),
    path.resolve(rootDir, ref),
    path.resolve(rootDir, 'avatars/thumb', path.basename(ref)),
  ];
  const hit = candidates.find(p => existsSync(p) && MIME[path.extname(p).toLowerCase()]);
  if (!hit) return null;
  return `data:${MIME[path.extname(hit).toLowerCase()]};base64,${readFileSync(hit).toString('base64')}`;
}

// "┗ 田中系統 / UI・API実装" -> "UI・API実装", "開発T 主担当 / 全体設計" -> "全体設計"
function cleanRole(role = '') {
  return role
    .replace(/^[┗┣└├]\s*/, '')
    .replace(/^\S+系統\s*\/\s*/, '')
    .replace(/^.*?主担当\s*\/\s*/, '')
    .trim();
}

function badgeLabel(badge = '') {
  const b = badge.replace(/[()（）]/g, '').trim();
  if (!b) return '';
  if (b === '主') return '主担当';
  if (b === 'AI主') return 'AIリード';
  return b;
}

export function loadOrg(configPath, rootDir) {
  const cfg = JSON.parse(readFileSync(configPath, 'utf8'));
  const configDir = path.dirname(path.resolve(configPath));

  // Organizations that share a short name are the same company (e.g. Ark prime + Ark QA).
  const companies = [];
  const orgToCompany = {};
  for (const [key, org] of Object.entries(cfg.organizations)) {
    let c = companies.find(x => x.short === org.short);
    if (!c) {
      c = {
        id: key,
        short: org.short,
        name: org.name.replace(/（.*?）$/, ''),
        tag: (org.name.match(/（(.*?)）$/) || [])[1] || '',
        color: org.color,
        count: 0,
      };
      companies.push(c);
    }
    orgToCompany[key] = c;
  }

  const depts = cfg.departments.map((d, i) => ({
    id: d.id,
    index: i,
    name: d.name,
    roles: (d.roles || []).map(r => r.replace(/^・\s*/, '')),
    memberIds: d.members.map(m => m.id),
  }));

  const people = new Map();
  const upsert = (m, parent, unit, deptIndex) => {
    let p = people.get(m.id);
    if (!p) {
      const company = orgToCompany[m.org];
      p = {
        id: m.id,
        name: m.name,
        companyId: company.id,
        color: company.color,
        avatar: resolveAvatar(m.avatar, configDir, rootDir) || initialsAvatar(m.name, company.color),
        parent: parent ?? null,
        deptIndex: deptIndex ?? -1,
        assignments: [],
      };
      people.set(m.id, p);
      company.count++;
    }
    if (parent && !p.parent) p.parent = parent;
    if (deptIndex != null && deptIndex >= 0 && p.deptIndex < 0) p.deptIndex = deptIndex;
    p.assignments.push({ unit, deptIndex: deptIndex ?? -1, badge: badgeLabel(m.badge), role: cleanRole(m.role) });
    return p;
  };

  const owner = upsert({ ...cfg.owner, badge: '' }, null, cfg.owner.title || 'プロジェクトオーナー');
  const pmTitle = cfg.pm.title || 'プロジェクトマネジメント';
  const pmLead = upsert(cfg.pm.lead, cfg.pm.lead.parent || owner.id, pmTitle);
  const pmMembers = (cfg.pm.members || []).map(m => upsert(m, m.parent || pmLead.id, pmTitle));
  cfg.departments.forEach((d, i) => d.members.forEach(m => upsert(m, m.parent, d.name, i)));

  for (const p of people.values()) {
    p.primary = p.assignments.find(a => a.deptIndex >= 0) || p.assignments[0];
    p.dual = p.assignments.length > 1;
    p.children = [];
  }
  for (const p of people.values()) if (p.parent && people.has(p.parent)) people.get(p.parent).children.push(p.id);
  // PM sits between 事業部 (0) and 開発T (1) when ordering siblings.
  const sortKey = id => { const p = people.get(id); return p.deptIndex < 0 ? 0.5 : p.deptIndex; };
  for (const p of people.values()) p.children.sort((a, b) => sortKey(a) - sortKey(b));

  return {
    title: cfg.projectTitle.replace(/\s*プロジェクト体制図\s*$/, ''),
    fullTitle: cfg.projectTitle,
    date: cfg.date || '',
    companies,
    depts,
    people,
    ownerId: owner.id,
    pmTitle,
    pmLeadId: pmLead.id,
    pmMemberIds: pmMembers.map(p => p.id),
  };
}

// Serializable snapshot for client-side scripts.
export function toClientJson(org) {
  return JSON.stringify({
    companies: org.companies,
    depts: org.depts,
    ownerId: org.ownerId,
    pmLeadId: org.pmLeadId,
    pmMemberIds: org.pmMemberIds,
    pmTitle: org.pmTitle,
    people: Object.fromEntries([...org.people].map(([id, p]) => [id, { ...p }])),
  }).replace(/</g, '\\u003c');
}

export const company = (org, p) => org.companies.find(c => c.id === p.companyId);

export const BASE_CSS = `
:root{
  --bg:#f5f6f8;--surface:#ffffff;--surface-2:#f1f3f6;--ink:#0f172a;--ink-2:#475569;--ink-3:#8a94a6;
  --line:#e3e7ee;--line-strong:#c3cad6;--accent:#0f172a;--shadow:0 1px 2px rgba(15,23,42,.06),0 4px 14px rgba(15,23,42,.05);
  color-scheme:light;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --bg:#0b0f19;--surface:#131a28;--surface-2:#1a2233;--ink:#e8ecf3;--ink-2:#a4aec0;--ink-3:#6b768b;
  --line:#232d40;--line-strong:#36425a;--accent:#e8ecf3;--shadow:0 1px 2px rgba(0,0,0,.4),0 6px 18px rgba(0,0,0,.25);
  color-scheme:dark;
}}
:root[data-theme="dark"]{
  --bg:#0b0f19;--surface:#131a28;--surface-2:#1a2233;--ink:#e8ecf3;--ink-2:#a4aec0;--ink-3:#6b768b;
  --line:#232d40;--line-strong:#36425a;--accent:#e8ecf3;--shadow:0 1px 2px rgba(0,0,0,.4),0 6px 18px rgba(0,0,0,.25);
  color-scheme:dark;
}
*{box-sizing:border-box}
html,body{margin:0}
body{background:var(--bg);color:var(--ink);font-family:"Noto Sans JP","Hiragino Sans","Yu Gothic UI","Meiryo",system-ui,sans-serif;
  font-size:14px;line-height:1.5;-webkit-font-smoothing:antialiased}
.page{max-width:1320px;margin:0 auto;padding:28px 16px 48px}
.topbar{display:flex;gap:16px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;margin-bottom:20px}
.eyebrow{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3);font-weight:700}
h1{font-size:24px;line-height:1.3;margin:4px 0 2px;font-weight:700;letter-spacing:.01em}
.sub{color:var(--ink-2);font-size:13px;margin:0}
.tools{display:flex;gap:8px;align-items:center}
.btn{font:inherit;font-size:12px;border:1px solid var(--line-strong);background:var(--surface);color:var(--ink);border-radius:8px;padding:6px 12px;cursor:pointer}
.btn:hover{background:var(--surface-2)}
.legend{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:12px;color:var(--ink-2)}
.legend .li{display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.legend .sw{width:10px;height:10px;border-radius:50%;background:var(--c)}
.legend b{color:var(--ink);font-weight:700}
.legend .n{color:var(--ink-3);font-variant-numeric:tabular-nums}
.av{width:40px;height:40px;border-radius:50%;object-fit:cover;flex:none;box-shadow:0 0 0 2px var(--surface),0 0 0 4px var(--c)}
.tag{display:inline-block;font-size:10px;font-weight:700;line-height:1;padding:3px 6px;border-radius:999px;vertical-align:2px;white-space:nowrap;
  background:var(--ink);color:var(--surface)}
.tag.soft{background:transparent;color:var(--ink-2);box-shadow:inset 0 0 0 1px var(--line-strong)}
.cochip{display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--ink-2);white-space:nowrap}
.cochip::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--c)}
@media print{.tools{display:none}body{background:#fff}}
`;

export const THEME_JS = `
(function(){
  var qt=new URLSearchParams(location.search).get('theme');
  if(qt==='light'||qt==='dark') document.documentElement.setAttribute('data-theme',qt);
  var b=document.getElementById('themeBtn'); if(!b) return;
  function cur(){var t=document.documentElement.getAttribute('data-theme'); if(t) return t;
    return matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
  function label(){b.textContent=cur()==='dark'?'☀ ライト':'☾ ダーク';}
  b.addEventListener('click',function(){document.documentElement.setAttribute('data-theme',cur()==='dark'?'light':'dark');label();
    window.dispatchEvent(new Event('themechange'));});
  label();
})();`;

export function legendHtml(org) {
  return `<div class="legend">${org.companies
    .map(c => `<span class="li" style="--c:${c.color}"><span class="sw"></span><b>${esc(c.short)}</b>${c.tag ? `<span>${esc(c.tag)}</span>` : ''}<span class="n">${c.count}名</span></span>`)
    .join('')}</div>`;
}

export function page({ title, description, css = '', body, js = '' }) {
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
<style>${BASE_CSS}${css}</style>
</head>
<body>
${body}
<script>${THEME_JS}</script>
${js ? `<script>${js}</script>` : ''}
</body>
</html>
`;
}
