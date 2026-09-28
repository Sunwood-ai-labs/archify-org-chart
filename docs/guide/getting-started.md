# 🚀 Getting Started

**Archify Org Chart** lets anyone generate an interactive, avatar-equipped **Project Governance & Organization Structure Chart (`プロジェクト体制図`)** from a single JSON file.

## 1. Clone the Repository

```bash
git clone https://github.com/Sunwood-ai-labs/archify-org-chart.git
cd archify-org-chart

# Requires Node.js 20+ and Git. Fetch the pinned rendering engine.
npm run setup:archify
```

## 2. Create Your Project Config (`*.org.json`)

Copy the starter template (`templates/starter.org.json`) to create your own project organization file:

```bash
cp templates/starter.org.json my-project.org.json
```

Edit `my-project.org.json` to set:

- **`projectTitle`**: Your project banner title (e.g., `次世代AI店舗DXプロジェクト プロジェクト体制図`)
- **`organizations`**: Participating companies and their theme colors
- **`owner`**: Top-center Project Owner (`name`, `role`, `avatar`)
- **`pm`**: Right-branching Project Management lead and members
- **`departments`**: The 4 department columns (`事業部`, `開発T`, `運用T`, `品質管理T`), including each member's `name`, `badge` (`(主)`), `parent` ID, `avatar` path, and the department's `roles` list (`・役割1...`).

## 3. Build the Interactive HTML

```bash
# Build the default 12-member showcase
npm run build

# Or build your custom config
node bin/archify-org-chart.mjs build my-project.org.json my-project.html
```

Open `project-governance-with-avatars.html` (or `my-project.html`) in your browser!

## 4. Explore Interactive Features

- **Guided Views**: Step through chapter highlights (`① オーナー＆PM主幹ツリー`, `② 事業部ツリー系統`, `③ 開発Tツリー系統`, `④ 運用T・品質管理Tツリー系統`).
- **Dark / Light & Visual Presets**: Switch between `Blueprint`, `Signal Flow`, and `Editorial` presets, or print directly in landscape mode.
- **Companion Template Board**: Scroll below the main SVG canvas to view the classic tabular `プロジェクト体制図` board where clicking any member card highlights their node in the interactive SVG.

## 🔧 Build and publication

- Run `npm run setup:archify` once to fetch the pinned engine into `.cache/archify`. Alternatively set `ARCHIFY_CLI` to an absolute path to `archify.mjs`. Missing engines fail explicitly; old example HTML is never reused for custom input.
- Relative avatar paths resolve **from the JSON file directory**: use `../avatars/thumb/sato_sponsor.jpg` from `examples/`, or `avatars/thumb/sato_sponsor.jpg` from a root-level config.
- `npm run build:starter` generates the initials-only starter. Custom builds also save an adjacent `.architecture.json` and leave the bundled examples and swimlane unchanged.
- `npm run build:demos` regenerates both demos and synchronizes the Pages files. The swimlane is a separate fixed example authored in `org-lineage-swimlane.workflow.json`.
- Expand **Organization board** at the bottom for the readable table. PM assistants appear in this board; selection is enabled when their ID also exists in the diagram.
- The fixed diagram viewer UI is English; authored names/descriptions are Japanese. The documentation supports both languages.
- HTML embeds the diagram and avatars. External fonts may be requested by the viewer; fonts fall back locally when offline.
