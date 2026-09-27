# 🚀 Getting Started

**Archify Org Chart** lets anyone generate an interactive, avatar-equipped **Project Governance & Organization Structure Chart (`プロジェクト体制図`)** from a single JSON file.

## 1. Clone the Repository

```bash
git clone https://github.com/Sunwood-ai-labs/archify-org-chart.git
cd archify-org-chart
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
