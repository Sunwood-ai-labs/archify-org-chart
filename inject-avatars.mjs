import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTemplateBoardHtml } from './src/board-template.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseDir = __dirname;

export function buildAvatarDataUri(member, org, rootDir = baseDir) {
  if (member.avatar) {
    const p = path.resolve(rootDir, member.avatar);
    if (fs.existsSync(p)) {
      const ext = path.extname(p).toLowerCase();
      const mime = ext === '.png' ? 'image/png' : ext === '.svg' ? 'image/svg+xml' : 'image/jpeg';
      const b64 = fs.readFileSync(p).toString('base64');
      return `data:${mime};base64,${b64}`;
    }
  }
  const initials = (member.name || '担当').replace(/\s+/g, '').slice(0, 2);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
    <rect width="80" height="80" rx="40" fill="#0f172a"/>
    <circle cx="40" cy="30" r="14" fill="${org.color}" opacity="0.85"/>
    <path d="M16 68c4-14 14-20 24-20s20 6 24 20" fill="${org.color}" opacity="0.65"/>
    <text x="40" y="74" font-family="sans-serif" font-size="11" font-weight="700" fill="#f8fafc" text-anchor="middle">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

export function collectMembersFromConfig(config) {
  const orgs = config.organizations;
  const list = [];
  const seen = new Set();

  function add(m) {
    if (!m || seen.has(m.id)) return;
    seen.add(m.id);
    const org = orgs[m.org] || { color: '#38bdf8', badgeBg: 'rgba(56,189,248,0.16)', short: '' };
    list.push({
      ...m,
      color: org.color,
      badgeBg: org.badgeBg,
      orgShort: org.short
    });
  }

  add(config.owner);
  if (config.pm?.lead) add(config.pm.lead);
  for (const d of config.departments || []) {
    for (const m of d.members || []) add(m);
  }
  for (const m of config.pm?.members || []) add(m);
  return list;
}

export function enhanceHtmlWithConfig(inputFile, outputFile, config, isWorkflow = false) {
  let html = fs.readFileSync(inputFile, 'utf8');
  const members = collectMembersFromConfig(config);
  const avatarDataUris = {};
  for (const m of members) {
    avatarDataUris[m.id] = buildAvatarDataUri(m, config.organizations[m.org] || {});
  }

  if (!isWorkflow) {
    // Expand SVG viewBox height to fit the 4-column ロール row + Legend cleanly
    html = html.replace(
      /viewBox="0 0 1082 \d+"/,
      'viewBox="0 0 1082 836"'
    );

    // Normalize all 4 department structural frames to equal height (y=266, height=362)
    html = html.replace(
      /(<rect data-graph-role="structural-frame"[^>]*?y="266"\s+width="[^"]+"\s+height=")236(")/g,
      '$1362$2'
    );

    // Hide default small boundary labels because we draw full-width centered 部署 header bars
    html = html.replace(
      /<g data-graph-role="structural-frame-label"[\s\S]*?<\/g>/g,
      ''
    );

    // Shift Legend down by +116px so it sits below the ロール row (y=638..748)
    html = html.replace(
      /<g data-legend=""[\s\S]*?<\/g>\s*<\/g>/,
      match =>
        match
          .replace(/\by="(\d+)"/g, (_, y) => `y="${parseInt(y, 10) + 116}"`)
          .replace(/\bdata-legend-baseline="(\d+)"/g, (_, y) => `data-legend-baseline="${parseInt(y, 10) + 116}"`)
    );

    // Build SVG structural overlay matching the user's reference diagram (部署 / 担当者 / ロール + headers)
    const colSpecs = [
      { x: 68, w: 188, dept: config.departments[0] },
      { x: 274, w: 356, dept: config.departments[1] },
      { x: 648, w: 188, dept: config.departments[2] },
      { x: 854, w: 188, dept: config.departments[3] }
    ];

    const deptHeaderBarsSvg = colSpecs
      .map(({ x, w, dept }) => {
        const cx = +(x + w / 2).toFixed(1);
        return `
          <rect x="${x}" y="236" width="${w}" height="26" rx="5" fill="#475569" stroke="${dept.headerColor}" stroke-width="1.5"/>
          <text x="${cx}" y="253" fill="#ffffff" font-size="10.5" font-weight="700" text-anchor="middle">${dept.name}</text>`;
      })
      .join('');

    const roleBoxesSvg = colSpecs
      .map(({ x, w, dept }) => {
        const lines = (dept.roles || [])
          .map(
            (r, idx) =>
              `<text x="${x + 10}" y="${658 + idx * 20}" class="t-primary" font-size="8.6" font-weight="500">${r}</text>`
          )
          .join('\n          ');
        return `
          <rect x="${x}" y="636" width="${w}" height="104" rx="8" class="c-region" stroke-width="1.2"/>
          ${lines}`;
      })
      .join('');

    const templateOverlaySvg = `
        <!-- Reference Template Structural Overlay: Owner/PM Titles + 部署 / 担当者 / ロール Rows -->
        <g aria-hidden="true" class="template-structure-overlay">
          <!-- Owner Header Pill -->
          <rect x="467" y="12" width="176" height="22" rx="4" fill="rgba(56, 189, 248, 0.18)" stroke="#38bdf8" stroke-width="1.2"/>
          <text x="555" y="26.5" class="t-primary" font-size="9.2" font-weight="700" text-decoration="underline" text-anchor="middle">プロジェクトオーナー (事業部)</text>

          <!-- PM Header Pill -->
          <rect x="740" y="100" width="180" height="22" rx="4" fill="rgba(16, 185, 129, 0.18)" stroke="#10b981" stroke-width="1.2"/>
          <text x="830" y="114.5" class="t-primary" font-size="9.2" font-weight="700" text-decoration="underline" text-anchor="middle">プロジェクトマネジメント</text>

          <!-- Left-Side Row Labels: 部署 / 担当者 / ロール -->
          <rect x="10" y="236" width="50" height="26" rx="5" fill="rgba(71, 85, 105, 0.38)" stroke="rgba(148, 163, 184, 0.4)" stroke-width="1"/>
          <text x="35" y="253" class="t-primary" font-size="10" font-weight="700" text-anchor="middle">部署</text>

          <rect x="10" y="266" width="50" height="362" rx="6" fill="rgba(30, 41, 59, 0.28)" stroke="rgba(148, 163, 184, 0.32)" stroke-width="1"/>
          <text x="35" y="450" class="t-primary" font-size="10" font-weight="700" text-anchor="middle">担当者</text>

          <rect x="10" y="636" width="50" height="104" rx="6" fill="rgba(30, 41, 59, 0.28)" stroke="rgba(148, 163, 184, 0.32)" stroke-width="1"/>
          <text x="35" y="692" class="t-primary" font-size="10" font-weight="700" text-anchor="middle">ロール</text>

          <!-- 4 Department Header Bars (事業部 | 開発T | 運用T |品質管理T) -->
          ${deptHeaderBarsSvg}

          <!-- 4 Department Role Boxes (ロール：・役割1 ・役割2 ・役割3...) -->
          ${roleBoxesSvg}
        </g>`;

    html = html.replace(
      '<!-- Components -->',
      `${templateOverlaySvg}\n\n        <!-- Components -->`
    );
  }

  // Inject circular portrait avatars right next to each member's name inside every SVG node
  const clipDefs = [];
  for (const m of members) {
    const nodeRegex = new RegExp(`(<g id="node-${m.id}"[\\s\\S]*?<\\/g>\\s*<\\/g>)`, 'm');
    const match = html.match(nodeRegex);
    if (!match) continue;

    let nodeBlock = match[1];
    const rectMatch = nodeBlock.match(/<rect x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/);
    if (!rectMatch) continue;

    const x = parseFloat(rectMatch[1]);
    const y = parseFloat(rectMatch[2]);
    const h = parseFloat(rectMatch[4]);

    const r = isWorkflow ? 14.5 : 18.0;
    const cx = +(x + 6 + r).toFixed(2);
    const cy = +(y + h / 2).toFixed(2);
    const imgX = +(cx - r).toFixed(2);
    const imgY = +(cy - r).toFixed(2);
    const imgSize = +(r * 2).toFixed(2);
    const textStartX = +(x + 6 + r * 2 + 6).toFixed(2);

    clipDefs.push(
      `          <clipPath id="avatar-clip-${m.id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>`
    );

    const avatarSvg = `<g aria-hidden="true" class="node-avatar-group">
            <circle cx="${cx}" cy="${cy}" r="${+(r + 1.6).toFixed(2)}" fill="#0f172a" stroke="${m.color}" stroke-width="2"/>
            <image href="${avatarDataUris[m.id]}" x="${imgX}" y="${imgY}" width="${imgSize}" height="${imgSize}" clip-path="url(#avatar-clip-${m.id})" preserveAspectRatio="xMidYMid slice"/>
          </g>`;

    nodeBlock = nodeBlock.replace(
      /<g aria-hidden="true" data-semantic-sigil="[^"]+"[\s\S]*?<\/g>/,
      avatarSvg
    );

    nodeBlock = nodeBlock.replace(
      /(<text data-node-label=""[^>]*?)\bx="[^"]+"([^>]*?)\bfont-size="[^"]+"([^>]*?)\btext-anchor="middle"/,
      `$1x="${textStartX}"$2font-size="${isWorkflow ? '8.4' : '9.6'}"$3text-anchor="start"`
    );
    nodeBlock = nodeBlock.replace(
      /(<text data-detail="context"[^>]*?)\bx="[^"]+"([^>]*?)\bfont-size="[^"]+"([^>]*?)\btext-anchor="middle"/,
      `$1x="${textStartX}"$2font-size="${isWorkflow ? '7.4' : '7.8'}"$3text-anchor="start"`
    );
    nodeBlock = nodeBlock.replace(
      /(<text data-detail="fine"[^>]*?)\bx="[^"]+"([^>]*?)\btext-anchor="middle"/,
      `$1x="${textStartX}"$2text-anchor="start"`
    );

    html = html.replace(match[1], nodeBlock);
  }

  html = html.replace('</defs>', `${clipDefs.join('\n')}\n        </defs>`);

  // Inject interactive HTML/CSS Template Board with avatars below the diagram
  const boardHtml = buildTemplateBoardHtml(config, avatarDataUris, members);
  html = html.replace('</body>', `${boardHtml}\n</body>`);

  fs.writeFileSync(outputFile, html, 'utf8');
  console.log(`Enhanced ${outputFile}`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const configPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.join(baseDir, 'examples/ai-retail-dx.org.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  enhanceHtmlWithConfig(
    path.join(baseDir, 'project-governance.architecture.html'),
    path.join(baseDir, 'project-governance-with-avatars.html'),
    config,
    false
  );
  enhanceHtmlWithConfig(
    path.join(baseDir, 'org-lineage-swimlane.workflow.html'),
    path.join(baseDir, 'org-lineage-swimlane-with-avatars.html'),
    config,
    true
  );
}
