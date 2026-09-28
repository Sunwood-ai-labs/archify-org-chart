export function buildTemplateBoardHtml(config, avatarDataUris, members, isWorkflow = false) {
  const orgs = config.organizations;
  const owner = config.owner;
  const ownerOrg = orgs[owner.org];
  const pmLead = config.pm.lead;
  const pmLeadOrg = orgs[pmLead.org];

  const pmSubHtml = (config.pm.members || [])
    .map(sub => {
      const subOrg = orgs[sub.org];
      return `
        <div class="tpl-person tpl-person-sub" onclick="window.__focusOrgNode('${sub.id}')">
          <img class="tpl-avatar" src="${avatarDataUris[sub.id]}" alt="${sub.name}" style="border-color:${subOrg.color}" />
          <div class="tpl-person-info">
            <div class="tpl-person-line">
              <span class="tpl-tree-mark">┗</span>
              <span class="tpl-person-name">${sub.name}</span>
              ${sub.badge ? `<span class="tpl-main-badge">${sub.badge}</span>` : ''}
            </div>
            <div class="tpl-person-meta">
              <span class="tpl-org-chip" style="color:${subOrg.color};border-color:${subOrg.color};background:${subOrg.badgeBg}">${subOrg.short}</span>
              <span>${sub.role}</span>
            </div>
          </div>
        </div>`;
    })
    .join('');

  const deptHeadersHtml = config.departments
    .map(
      d => `<div class="tpl-dept-header" style="border-top: 3px solid ${d.headerColor}">${d.name}</div>`
    )
    .join('');

  const deptMembersHtml = config.departments
    .map(d => {
      const mCards = d.members
        .map((m, idx) => {
          const mOrg = orgs[m.org];
          const isSub = idx > 0;
          return `
            <div class="tpl-person ${isSub ? 'tpl-person-sub' : 'tpl-person-lead'}" onclick="window.__focusOrgNode('${m.id}')">
              <img class="tpl-avatar" src="${avatarDataUris[m.id]}" alt="${m.name}" style="border-color:${mOrg.color}" />
              <div class="tpl-person-info">
                <div class="tpl-person-line">
                  <span class="tpl-person-name">${m.name}</span>
                  ${m.badge ? `<span class="tpl-main-badge">${m.badge}</span>` : ''}
                </div>
                <div class="tpl-person-meta">
                  <span class="tpl-org-chip" style="color:${mOrg.color};border-color:${mOrg.color};background:${mOrg.badgeBg}">${mOrg.short}</span>
                  <span>${m.role}</span>
                </div>
              </div>
            </div>`;
        })
        .join('');
      return `<div class="tpl-cell tpl-members-cell" data-department="${d.name}">${mCards}</div>`;
    })
    .join('');

  const deptRolesHtml = config.departments
    .map(d => {
      const rItems = d.roles.map(r => `<li>${r}</li>`).join('');
      return `<div class="tpl-cell tpl-roles-cell" data-department="${d.name}"><ul class="tpl-role-list">${rItems}</ul></div>`;
    })
    .join('');

  return `
  <details class="org-board-details no-print"><summary>プロジェクト体制図を表で見る / Organization board</summary>
  <section class="org-lineage-board no-print" aria-label="プロジェクト体制図（テンプレート準拠・アバター付き）">
    <style>
      .org-board-details { max-width: 1280px; margin: 1rem auto; }
      .org-board-details > summary { cursor: pointer; padding: .8rem; color: var(--text, #94a3b8); }
      .org-lineage-board {
        max-width: 1280px;
        margin: 1.5rem auto 2.5rem;
        padding: 1.5rem 1.75rem;
        border-radius: 1rem;
        background: var(--panel, rgba(15, 23, 42, 0.92));
        border: 1px solid var(--panel-border, rgba(148, 163, 184, 0.25));
        box-shadow: 0 18px 42px rgba(0, 0, 0, 0.28);
        font-family: 'Inter', 'Hiragino Sans', 'Noto Sans JP', sans-serif;
      }
      .tpl-date-row {
        text-align: right;
        font-size: 0.78rem;
        color: var(--text-muted, #94a3b8);
        margin-bottom: 0.35rem;
      }
      .tpl-banner {
        border: 1.5px solid rgba(148, 163, 184, 0.45);
        padding: 0.6rem 1rem;
        text-align: center;
        font-size: 1.15rem;
        font-weight: 800;
        letter-spacing: 0.06em;
        color: var(--text, #f8fafc);
        background: rgba(15, 23, 42, 0.55);
        border-radius: 0.4rem;
        margin-bottom: 1.25rem;
      }
      [data-theme="light"] .tpl-banner {
        background: #f8fafc;
        color: #0f172a;
        border-color: #94a3b8;
      }
      /* Top tree trunk: Owner at center, PM branching right */
      .tpl-top-tree {
        position: relative;
        display: grid;
        grid-template-columns: 1fr 290px 1fr;
        grid-template-rows: auto 56px 28px;
        align-items: center;
        margin-left: 68px;
      }
      .tpl-owner-box {
        grid-column: 2;
        grid-row: 1;
        border: 1.5px solid #38bdf8;
        border-radius: 0.5rem;
        padding: 0.7rem 0.9rem;
        background: rgba(15, 23, 42, 0.85);
        text-align: center;
        z-index: 2;
      }
      [data-theme="light"] .tpl-owner-box,
      [data-theme="light"] .tpl-pm-box,
      [data-theme="light"] .tpl-cell {
        background: #ffffff;
        color: #0f172a;
      }
      .tpl-box-heading {
        font-size: 0.82rem;
        font-weight: 800;
        text-decoration: underline;
        text-underline-offset: 3px;
        color: var(--text, #f8fafc);
        margin-bottom: 0.15rem;
      }
      [data-theme="light"] .tpl-box-heading { color: #0f172a; }
      .tpl-box-sub {
        font-size: 0.72rem;
        color: var(--text-muted, #94a3b8);
        margin-bottom: 0.45rem;
      }
      .tpl-trunk-vertical {
        grid-column: 2;
        grid-row: 2 / 4;
        width: 2px;
        height: 100%;
        background: #64748b;
        justify-self: center;
      }
      .tpl-pm-branch-wrap {
        grid-column: 3;
        grid-row: 1 / 3;
        display: flex;
        align-items: center;
        align-self: end;
        margin-bottom: 6px;
        margin-left: -145px;
      }
      .tpl-pm-branch-line {
        width: 175px;
        height: 2px;
        background: #64748b;
        flex-shrink: 0;
      }
      .tpl-pm-box {
        border: 1.5px solid #10b981;
        border-radius: 0.5rem;
        padding: 0.65rem 0.85rem;
        background: rgba(15, 23, 42, 0.85);
        min-width: 250px;
        z-index: 2;
      }
      /* 4-column horizontal fork bar */
      .tpl-fork-grid {
        margin-left: 68px;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        height: 26px;
        position: relative;
      }
      .tpl-fork-grid::before {
        content: '';
        position: absolute;
        top: 0;
        left: 12.5%;
        right: 12.5%;
        height: 2px;
        background: #64748b;
      }
      .tpl-fork-drop {
        width: 2px;
        height: 100%;
        background: #64748b;
        justify-self: center;
      }
      /* Main 4-column matrix with left row headers (部署 / 担当者 / ロール) */
      .tpl-matrix-row {
        display: grid;
        grid-template-columns: 60px repeat(4, 1fr);
        gap: 0.65rem;
        margin-bottom: 0.65rem;
        align-items: stretch;
      }
      .tpl-row-label {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.84rem;
        font-weight: 800;
        color: var(--text, #f8fafc);
        writing-mode: horizontal-tb;
        text-align: center;
        border-right: 2px solid rgba(148, 163, 184, 0.35);
        padding-right: 0.35rem;
      }
      [data-theme="light"] .tpl-row-label { color: #0f172a; }
      .tpl-dept-header {
        background: #475569;
        color: #ffffff;
        font-size: 0.88rem;
        font-weight: 800;
        text-align: center;
        padding: 0.5rem 0.5rem;
        border-radius: 0.35rem;
        letter-spacing: 0.05em;
      }
      .tpl-cell {
        border: 1.5px solid rgba(148, 163, 184, 0.4);
        border-radius: 0.45rem;
        padding: 0.65rem;
        background: rgba(15, 23, 42, 0.65);
        display: flex;
        flex-direction: column;
        gap: 0.48rem;
      }
      .tpl-person {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        padding: 0.38rem 0.5rem;
        border-radius: 0.45rem;
        background: rgba(30, 41, 59, 0.72);
        border: 1px solid rgba(148, 163, 184, 0.22);
        cursor: pointer;
        transition: transform 140ms ease, border-color 140ms ease;
        text-align: left;
      }
      [data-theme="light"] .tpl-person {
        background: #f8fafc;
        border-color: #cbd5e1;
      }
      .tpl-person:hover {
        transform: translateY(-1px);
        border-color: #38bdf8;
      }
      .tpl-person-sub {
        margin-left: 0.85rem;
        position: relative;
      }
      .tpl-avatar {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid #38bdf8;
        flex-shrink: 0;
      }
      .tpl-person-info {
        min-width: 0;
        flex: 1;
      }
      .tpl-person-line {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        flex-wrap: wrap;
      }
      .tpl-tree-mark {
        color: #94a3b8;
        font-weight: 700;
        font-size: 0.78rem;
      }
      .tpl-person-name {
        font-size: 0.84rem;
        font-weight: 700;
        color: var(--text, #f8fafc);
      }
      [data-theme="light"] .tpl-person-name { color: #0f172a; }
      .tpl-main-badge {
        font-size: 0.7rem;
        font-weight: 800;
        color: #fbbf24;
        background: rgba(251, 191, 36, 0.16);
        padding: 0.05rem 0.32rem;
        border-radius: 0.25rem;
      }
      [data-theme="light"] .tpl-main-badge {
        color: #b45309;
        background: rgba(245, 158, 11, 0.16);
      }
      .tpl-person-meta {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        flex-wrap: wrap;
        font-size: 0.68rem;
        color: var(--text-muted, #94a3b8);
        margin-top: 0.12rem;
      }
      .tpl-org-chip {
        font-size: 0.62rem;
        font-weight: 700;
        padding: 0.04rem 0.32rem;
        border-radius: 999px;
        border: 1px solid;
      }
      .tpl-role-list {
        list-style: none;
        padding: 0;
        margin: 0;
        font-size: 0.76rem;
        line-height: 1.65;
        color: var(--text, #e2e8f0);
      }
      [data-theme="light"] .tpl-role-list { color: #1e293b; }
      .tpl-person:focus-visible { outline: 3px solid #38bdf8; }
      .tpl-cell { min-width: 0; }
      .tpl-person-info { overflow-wrap: anywhere; }
      @media (max-width: 900px) {
        .toolbar { position: relative; top: auto; right: auto; left: auto; transform: none; width: auto; max-width: 100%; flex-wrap: wrap; justify-content: flex-start; margin: 0 1rem 1rem; }
        .org-lineage-board { padding: .75rem; }
        .tpl-top-tree { display: flex; flex-direction: column; gap: 1rem; margin: 0; }
        .tpl-pm-branch-wrap { margin: 0; align-self: stretch; }
        .tpl-owner-box, .tpl-pm-box { width: 100%; min-width: 0; box-sizing: border-box; }
        .tpl-trunk-vertical, .tpl-pm-branch-line, .tpl-fork-grid { display: none; }
        .tpl-matrix-row { grid-template-columns: 1fr; }
        .tpl-row-label { justify-content: flex-start; border: 0; margin-top: .75rem; }
        .tpl-cell::before { content: attr(data-department); font-weight: bold; }
      }
    </style>

    <div class="tpl-date-row">${config.date}</div>
    <div class="tpl-banner">${config.projectTitle}</div>

    <!-- Top Owner & Right-Branching PM -->
    <div class="tpl-top-tree">
      <div class="tpl-owner-box">
        <div class="tpl-box-heading">${owner.title}</div>
        <div class="tpl-box-sub">${owner.department}</div>
        <div class="tpl-person" onclick="window.__focusOrgNode('${owner.id}')">
          <img class="tpl-avatar" src="${avatarDataUris[owner.id]}" alt="${owner.name}" style="border-color:${ownerOrg.color}" />
          <div class="tpl-person-info">
            <div class="tpl-person-line">
              <span class="tpl-person-name">${owner.name}</span>
            </div>
            <div class="tpl-person-meta">
              <span class="tpl-org-chip" style="color:${ownerOrg.color};border-color:${ownerOrg.color};background:${ownerOrg.badgeBg}">${ownerOrg.short}</span>
              <span>${owner.role}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="tpl-trunk-vertical"></div>

      <div class="tpl-pm-branch-wrap">
        <div class="tpl-pm-branch-line"></div>
        <div class="tpl-pm-box">
          <div class="tpl-box-heading" style="text-align:center;margin-bottom:0.45rem">${config.pm.title}</div>
          <div class="tpl-person" onclick="window.__focusOrgNode('${pmLead.id}')" style="margin-bottom:0.38rem">
            <img class="tpl-avatar" src="${avatarDataUris[pmLead.id]}" alt="${pmLead.name}" style="border-color:${pmLeadOrg.color}" />
            <div class="tpl-person-info">
              <div class="tpl-person-line">
                <span class="tpl-person-name">${pmLead.name}</span>
                <span class="tpl-main-badge">${pmLead.badge}</span>
              </div>
              <div class="tpl-person-meta">
                <span class="tpl-org-chip" style="color:${pmLeadOrg.color};border-color:${pmLeadOrg.color};background:${pmLeadOrg.badgeBg}">${pmLeadOrg.short}</span>
                <span>${pmLead.role}</span>
              </div>
            </div>
          </div>
          ${pmSubHtml}
        </div>
      </div>
    </div>

    <!-- 4-Way Horizontal Fork into Department Columns -->
    <div class="tpl-fork-grid">
      <div class="tpl-fork-drop"></div>
      <div class="tpl-fork-drop"></div>
      <div class="tpl-fork-drop"></div>
      <div class="tpl-fork-drop"></div>
    </div>

    <!-- Row 1: 部署 -->
    <div class="tpl-matrix-row">
      <div class="tpl-row-label">部署</div>
      ${deptHeadersHtml}
    </div>

    <!-- Row 2: 担当者（アバター＋企業バッジ＋系統ツリー） -->
    <div class="tpl-matrix-row">
      <div class="tpl-row-label">担当者</div>
      ${deptMembersHtml}
    </div>

    <!-- Row 3: ロール -->
    <div class="tpl-matrix-row">
      <div class="tpl-row-label">ロール</div>
      ${deptRolesHtml}
    </div>
  </section>
  </details>
  <script>
    document.querySelectorAll('.org-lineage-board .tpl-person').forEach(card => {
      const id = card.getAttribute('onclick').match(/'([^']+)'/)[1];
      if (!document.getElementById('node-' + id)) {
        card.removeAttribute('onclick'); card.style.cursor = 'default'; return;
      }
      card.setAttribute('role', 'button'); card.tabIndex = 0;
      card.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); card.click(); }
      });
    });
    window.__focusOrgNode = function(nodeId) {
      const g = document.getElementById('node-' + nodeId);
      if (g) {
        g.scrollIntoView({ behavior: 'smooth', block: 'center' });
        g.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      }
    };
  </script>`;
}
