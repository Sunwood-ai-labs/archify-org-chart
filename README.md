<div align="center">
  <img src="./assets/header-banner.svg" alt="Archify Org Chart Header Banner" width="100%" />

  <h1>Archify Org Chart</h1>

  <p>
    <strong>Multi-Organization Project Governance &amp; Avatar Lineage Tree Generator powered by <a href="https://github.com/tt-a1i/archify">tt-a1i/archify</a></strong>
  </p>

  <p>
    <a href="https://github.com/Sunwood-ai-labs/archify-org-chart/actions/workflows/deploy-docs.yml"><img src="https://img.shields.io/github/actions/workflow/status/Sunwood-ai-labs/archify-org-chart/deploy-docs.yml?branch=main&style=flat-square&label=Docs%20%26%20Demo" alt="Docs & Demo Status" /></a>
    <a href="https://github.com/tt-a1i/archify"><img src="https://img.shields.io/badge/Engine-tt--a1i%2Farchify-0891b2?style=flat-square" alt="Powered by Archify" /></a>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-10b981?style=flat-square" alt="MIT License" /></a>
    <img src="https://img.shields.io/badge/Node.js-%3E%3D20-38bdf8?style=flat-square" alt="Node.js >= 20" />
  </p>

  <p>
    <a href="./README.md"><img src="https://img.shields.io/badge/Language-English-0284c7?style=for-the-badge" alt="English" /></a>
    <a href="./README.ja.md"><img src="https://img.shields.io/badge/%E8%A8%80%E8%AA%9E-%E6%97%A5%E6%9C%AC%E8%AA%9E-475569?style=for-the-badge" alt="日本語" /></a>
    <a href="https://sunwood-ai-labs.github.io/archify-org-chart/"><img src="https://img.shields.io/badge/Live_Demo-GitHub_Pages-a855f7?style=for-the-badge" alt="Live Demo" /></a>
  </p>
</div>

---

## ✨ Overview

**Archify Org Chart** is a declarative generator and template kit for building interactive, Japanese enterprise-style **Project Governance & Organization Structure Charts (`プロジェクト体制図`)** on top of [`tt-a1i/archify`](https://github.com/tt-a1i/archify).

From a single JSON configuration file (`*.org.json`), it generates a self-contained, single-file interactive HTML/SVG diagram featuring:

- **Top-Down Hierarchical Tree Layout**: `プロジェクトオーナー (Top Center)` ➔ `プロジェクトマネジメント (Right Branch)` ➔ `4 Department Columns (事業部 | 開発T | 運用T | 品質管理T)`.
- **Matrix Row Structure (`部署` / `担当者` / `ロール`)**: Cleanly aligns department headers, member reporting lines (`(主)` lead to `┗` subordinate), and role bullet lists (`・役割1`, `・役割2`, `・役割3`).
- **Circular Portrait Avatars on Every Name**: Automatically embeds circular portrait avatars (`avatars/thumb/*.jpg`, `.png`, `.svg`, or auto-generated SVG initials) directly beside each person's name in both the interactive Archify SVG and the companion HTML governance board.
- **Multi-Company Lineage Coloring**: Clearly distinguishes client, prime contractor, AI lab partner, and SRE partner organizations even when multiple companies collaborate inside the same department (e.g., `開発T`).

## 🖼️ Visual Preview

### Dark Blueprint Theme (`project-governance-with-avatars.html`)

![Project Governance Tree Dark Preview](./assets/preview-dark.png)

### Light Print-Ready Theme (`project-governance-with-avatars.html`)

![Project Governance Tree Light Preview](./assets/preview-light.png)

### Cross-Organization Workflow Swimlane (`org-lineage-swimlane-with-avatars.html`)

![Workflow Swimlane Dark Preview](./assets/swimlane-dark.png)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Sunwood-ai-labs/archify-org-chart.git
cd archify-org-chart
```

### 2. Edit Your Organization Config (`*.org.json`)

Copy the starter template [`templates/starter.org.json`](./templates/starter.org.json) and customize your project title, organizations, members, avatars, and department roles:

```bash
cp templates/starter.org.json my-project.org.json
```

### 3. Build Your Interactive Org Chart

```bash
# Build the default 4-company, 12-member AI Retail DX showcase
npm run build

# Or build from your own custom JSON config
node bin/archify-org-chart.mjs build my-project.org.json my-project.html
```

Open the generated `project-governance-with-avatars.html` (or `my-project.html`) in any browser. No server or runtime dependencies are required to view or share the output HTML.

## 🧩 Declarative JSON Schema (`*.org.json`)

Each `*.org.json` file defines five top-level sections:

| Field | Description |
| :--- | :--- |
| `projectTitle` | Main banner title (`□□□□ プロジェクト プロジェクト体制図`) |
| `organizations` | Map of participating companies with `name`, `short`, `type` (`frontend`, `backend`, `cloud`, `security`, `messagebus`), and `color` |
| `owner` | Top-level Project Owner (`id`, `name`, `title`, `department`, `role`, `org`, `avatar`) |
| `pm` | Right-branching Project Management office (`title`, `lead`, and optional `members`) |
| `departments` | Array of 4 department columns (`事業部`, `開発T`, `運用T`, `品質管理T`), each with `members` (`(主)` lead + `┗` subordinates with `parent` and `avatar`) and `roles` (`・役割1...`) |

If a member's `avatar` file path is omitted or does not exist yet, the builder automatically generates a clean circular SVG badge with the member's initials and organization color.

## 📂 Repository Structure

```text
archify-org-chart/
├── assets/
│   ├── header-banner.svg                     # SVG hero banner
│   ├── logo.svg                              # SVG project icon
│   ├── preview-dark.png                      # Dark mode tree preview
│   ├── preview-light.png                     # Light mode tree preview
│   └── swimlane-dark.png                     # Workflow swimlane preview
├── avatars/
│   └── thumb/                                # 160x160 circular portrait thumbnails (12 members)
├── bin/
│   └── archify-org-chart.mjs                 # CLI generator entry point
├── docs/                                     # Bilingual VitePress documentation & live demos
├── examples/
│   └── ai-retail-dx.org.json                 # Full 4-company, 12-member showcase configuration
├── src/
│   └── board-template.mjs                    # HTML/CSS template-matched governance board builder
├── templates/
│   └── starter.org.json                      # Blank starter template (〇〇 〇〇 / ・役割1,2,3)
├── inject-avatars.mjs                        # SVG avatar & template-overlay enhancer
├── project-governance.architecture.json      # Generated Archify architecture spec
├── project-governance-with-avatars.html      # Generated interactive tree chart with avatars
├── org-lineage-swimlane.workflow.json        # Cross-company workflow swimlane spec
└── org-lineage-swimlane-with-avatars.html    # Generated interactive swimlane with avatars
```

## 📖 Documentation & Live Demo

Full bilingual documentation (English & Japanese) and embedded interactive demos are published via VitePress on GitHub Pages:

- **Documentation & Live Demo**: [https://sunwood-ai-labs.github.io/archify-org-chart/](https://sunwood-ai-labs.github.io/archify-org-chart/)
- **Interactive Governance Tree**: [https://sunwood-ai-labs.github.io/archify-org-chart/demo/project-governance.html](https://sunwood-ai-labs.github.io/archify-org-chart/demo/project-governance.html)
- **Interactive Workflow Swimlane**: [https://sunwood-ai-labs.github.io/archify-org-chart/demo/workflow-swimlane.html](https://sunwood-ai-labs.github.io/archify-org-chart/demo/workflow-swimlane.html)

To preview the documentation site locally:

```bash
npm --prefix docs install
npm run docs:dev
```

## 📄 License

Released under the [MIT License](./LICENSE). Diagram rendering engine powered by [`tt-a1i/archify`](https://github.com/tt-a1i/archify).
