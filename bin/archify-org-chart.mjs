#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateConfig } from '../src/config.mjs';
import os from 'node:os';
import { enhanceHtmlWithConfig } from '../inject-avatars.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

export function generateArchitectureSpec(config) {
  const orgs = config.organizations || {};
  const legendEntries = {
    frontend: { label: '事業部', visible: false },
    backend: { label: 'PM・開発T', visible: false },
    cloud: { label: 'AI・データパートナー', visible: false },
    security: { label: '運用T・SRE', visible: false },
    messagebus: { label: '品質管理T・QA', visible: false },
    database: { label: 'データ基盤', visible: false },
    external: { label: '外部', visible: false }
  };

  for (const org of Object.values(orgs)) {
    if (org.type && legendEntries[org.type]) {
      legendEntries[org.type] = { label: org.name, visible: true };
    }
  }

  const components = [];
  const boundaries = [];
  const connections = [];

  const owner = config.owner;
  const ownerOrg = orgs[owner.org] || { type: 'frontend', short: '' };
  components.push({
    id: owner.id,
    type: ownerOrg.type || 'frontend',
    label: owner.name,
    sublabel: `${owner.title} ${owner.department || ''}`.trim(),
    tag: ownerOrg.short || '',
    pos: [467, 36],
    size: [176, 62]
  });

  const pmLead = config.pm.lead;
  const pmOrg = orgs[pmLead.org] || { type: 'backend', short: '' };
  components.push({
    id: pmLead.id,
    type: pmOrg.type || 'backend',
    label: `${pmLead.name} ${pmLead.badge || '(主)'}`.trim(),
    sublabel: config.pm.title || 'プロジェクトマネジメント',
    tag: pmOrg.short || '',
    pos: [740, 124],
    size: [180, 62]
  });
  connections.push({
    from: owner.id,
    to: pmLead.id,
    variant: 'emphasis',
    fromSide: 'bottom',
    toSide: 'left'
  });

  const colLayout = [
    { leadX: 84, subXs: [84], width: 156 },
    { leadX: 374, subXs: [290, 462], width: 156, subWidth: 152 },
    { leadX: 664, subXs: [664], width: 156 },
    { leadX: 870, subXs: [870], width: 156 }
  ];

  (config.departments || []).slice(0, 4).forEach((dept, colIdx) => {
    const layout = colLayout[colIdx];
    const wraps = [];
    const members = dept.members || [];

    members.forEach((m, mIdx) => {
      const mOrg = orgs[m.org] || { type: 'backend', short: '' };
      wraps.push(m.id);
      let x = layout.leadX;
      let y = 290;
      let w = layout.width;

      if (mIdx === 1) {
        if (members.length === 2) {
          x = layout.leadX;
          y = 420;
          w = layout.width;
        } else {
          x = layout.subXs[0];
          y = 420;
          w = layout.subWidth || layout.width;
        }
      } else if (mIdx === 2) {
        x = layout.subXs[1] ?? layout.subXs[0];
        y = 420;
        w = layout.subWidth || layout.width;
      } else if (mIdx >= 3) {
        x = layout.subXs[1] ?? layout.subXs[0];
        y = 546;
        w = layout.subWidth || layout.width;
      }

      components.push({
        id: m.id,
        type: mOrg.type || 'backend',
        label: `${m.name} ${m.badge || ''}`.trim(),
        sublabel: m.role,
        tag: mOrg.short || '',
        pos: [x, y],
        size: [w, 62]
      });

      if (mIdx === 0) {
        connections.push({
          from: m.parent || owner.id,
          to: m.id,
          variant: 'emphasis',
          fromSide: 'bottom',
          toSide: 'top'
        });
      } else if (m.parent) {
        const isStraight = members.length === 2 || mIdx >= 3;
        const conn = {
          from: m.parent,
          to: m.id,
          variant: mOrg.type === 'security' ? 'security' : 'default',
          fromSide: 'bottom',
          toSide: 'top'
        };
        if (isStraight) conn.route = 'straight';
        connections.push(conn);
      }
    });

    boundaries.push({
      kind: 'region',
      label: dept.name,
      wraps,
      pad: 16
    });
  });

  const depts = config.departments || [];
  const allLeadIds = [
    owner.id,
    pmLead.id,
    ...depts.map(d => d.members?.[0]?.id).filter(Boolean)
  ];

  const views = [
    {
      id: 'owner-pm-trunk',
      label: '① オーナー＆PM主幹ツリー',
      focus: allLeadIds,
      note: 'プロジェクトオーナーから右分岐のPMを経て、4部署の各主担当へ分岐する主幹ツリー。'
    }
  ];
  if (depts[0]) {
    views.push({
      id: 'biz-team-lineage',
      label: `② ${depts[0].name}ツリー系統`,
      focus: [owner.id, ...(depts[0].members || []).map(m => m.id)],
      note: `【${depts[0].name}】主担当から各メンバーへ連なる直属系統。`
    });
  }
  if (depts[1]) {
    views.push({
      id: 'dev-team-lineage',
      label: `③ ${depts[1].name}ツリー系統`,
      focus: [owner.id, pmLead.id, ...(depts[1].members || []).map(m => m.id)],
      note: `【${depts[1].name}】複数組織を横断して分岐する開発・AI系統。`
    });
  }
  if (depts[2] || depts[3]) {
    views.push({
      id: 'ops-qa-lineage',
      label: '④ 運用T・品質管理Tツリー系統',
      focus: [
        owner.id,
        pmLead.id,
        ...(depts[2]?.members || []).map(m => m.id),
        ...(depts[3]?.members || []).map(m => m.id)
      ],
      note: '【運用T・品質管理T】インフラ監視・セキュリティ監査・品質ゲートを担う系統。'
    });
  }

  const cards = [
    depts[0] && {
      dot: 'cyan',
      title: `${depts[0].name}のロール`,
      items: (depts[0].roles || []).slice(0, 3)
    },
    depts[1] && {
      dot: 'emerald',
      title: `${depts[1].name}のロール`,
      items: (depts[1].roles || []).slice(0, 3)
    },
    (depts[2] || depts[3]) && {
      dot: 'rose',
      title: `${depts[2]?.name || '運用T'} ＆ ${depts[3]?.name || '品質管理T'}のロール`,
      items: [
        ...(depts[2]?.roles || []).slice(0, 2),
        ...(depts[3]?.roles || []).slice(0, 1)
      ]
    }
  ].filter(Boolean);

  return {
    schema_version: 1,
    diagram_type: 'architecture',
    meta: {
      title: config.projectTitle,
      subtitle: config.projectSubtitle || '',
      output: 'project-governance.architecture.html',
      visual_preset: 'blueprint',
      quality_profile: 'showcase',
      legend: {
        mode: 'all',
        entries: legendEntries
      },
      views
    },
    components,
    boundaries,
    connections,
    cards
  };
}

function findArchifyCli() {
  if (process.env.ARCHIFY_CLI) return fs.existsSync(process.env.ARCHIFY_CLI) ? process.env.ARCHIFY_CLI : null;
  const candidates = [
    process.env.ARCHIFY_CLI,
    path.resolve(rootDir, '.cache/archify/archify/bin/archify.mjs'),
    path.resolve(rootDir, 'vendor/archify/bin/archify.mjs')
  ].filter(Boolean);
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}


export function build(configPath, outputPath, { baseOutput, specOutput } = {}) {
  const config = validateConfig(JSON.parse(fs.readFileSync(configPath, 'utf8')));
  const out = path.resolve(outputPath);
  if (!out.endsWith('.html')) throw new Error('Output must end in .html');
  const archifyCli = findArchifyCli();
  if (!archifyCli) throw new Error('Archify is required. Run npm run setup:archify or set ARCHIFY_CLI.');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'archify-org-'));
  try {
    const specOut = path.join(tmp, 'chart.json');
    const baseHtml = path.join(tmp, 'chart.html');
    fs.writeFileSync(specOut, JSON.stringify(generateArchitectureSpec(config), null, 2) + '\n');
    execFileSync(process.execPath, [archifyCli, 'deliver', 'architecture', specOut, baseHtml, '--quality', 'showcase', '--json'], { stdio: 'inherit' });
    const enhanced = path.join(tmp, 'enhanced.html');
    enhanceHtmlWithConfig(baseHtml, enhanced, config, false, path.dirname(configPath));
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.copyFileSync(enhanced, out);
    fs.copyFileSync(specOut, out.replace(/\.html$/, '.architecture.json'));
    if (baseOutput) fs.copyFileSync(baseHtml, baseOutput);
    if (specOutput) fs.copyFileSync(specOut, specOutput);
    console.log('Built ' + out);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command = 'build', config = path.join(rootDir, 'examples/ai-retail-dx.org.json'), output = path.join(rootDir, 'project-governance-with-avatars.html')] = process.argv.slice(2);
  try {
    if (command === '--help' || command === 'help') console.log('Usage: archify-org-chart build [config.org.json] [output.html]');
    else if (command !== 'build') throw new Error('Unknown command: ' + command);
    else build(path.resolve(config), output);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
