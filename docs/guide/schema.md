# 🧩 Config Schema & Avatars

## Overview of `*.org.json`

A project organization chart is defined by a single JSON file (`examples/ai-retail-dx.org.json` or `templates/starter.org.json`).

```json
{
  "projectTitle": "□□□□ プロジェクト プロジェクト体制図",
  "date": "2026年 4月 1日",
  "organizations": {
    "client_org": {
      "name": "発注元企業（事業部）",
      "short": "発注元",
      "type": "frontend",
      "color": "#38bdf8",
      "badgeBg": "rgba(56, 189, 248, 0.16)"
    }
  },
  "owner": {
    "id": "sato_sponsor",
    "name": "佐藤 健一",
    "title": "プロジェクトオーナー",
    "department": "(事業部)",
    "role": "執行役員 / 統括オーナー",
    "org": "client_org",
    "avatar": "avatars/thumb/sato_sponsor.jpg"
  }
}
```

## Attaching Portrait Avatars to Names

Every member object (`owner`, `pm.lead`, `pm.members[]`, and `departments[].members[]`) supports an `avatar` field:

1. **Custom Image (`avatars/thumb/*.jpg`, `.png`, `.svg`)**:
   Place a square portrait image (recommended `160x160` px) in `avatars/thumb/` and reference it via `"avatar": "avatars/thumb/member_id.jpg"`. The generator embeds it as a `data:` URI so the output HTML remains a single self-contained file.
2. **Automatic SVG Portrait Fallback**:
   If `"avatar"` is omitted or the file does not exist yet, `inject-avatars.mjs` automatically generates a circular SVG portrait icon with the member's initials and their organization's color.

## Defining Multi-Company Lineage inside a Department

Inside each department's `members` array:

- The first member (`index 0`) is placed at the top of the department column as the department lead (`"badge": "(主)"`).
- Subsequent members specify `"parent": "<parent_member_id>"` and can belong to any organization key in `organizations` (for example, an external AI partner working under the prime contractor's lead architect in `開発T`).

## Supported layout and validation

This is a fixed four-department template. Column 2 supports 1–4 members; the other columns support 1–2. Each department supports at most four role lines. Excess capacity, duplicate IDs, unknown organizations and reporting cycles fail explicitly. Larger teams require a different layout.

`parent` determines the actual reporting edge. Set it for every non-lead department member. Department leads default to the owner when omitted.

`pm.members` defines assistant cards in the companion board. Reuse a department member ID for a dual assignment and node selection; standalone assistants are board-only.

Avatar paths are relative to the configuration directory. JPG, PNG and SVG are supported. Missing/omitted paths use initials. People, companies and portraits in the showcase are demo content. The starter includes no portrait photos.
