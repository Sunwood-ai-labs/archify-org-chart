# 🧩 設定スキーマ＆アバター設定

## `*.org.json` の全体構造

体制図は1つの JSON ファイル（`examples/ai-retail-dx.org.json` または `templates/starter.org.json`）で定義します。

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

## 名前の横にアバターアイコンを表示する方法

すべての人物オブジェクト（`owner`, `pm.lead`, `pm.members[]`, `departments[].members[]`）に `avatar` フィールドを指定できます：

1. **任意の画像ファイルを指定する場合（`avatars/thumb/*.jpg`, `.png`, `.svg`）**:
   正方形の顔写真・イラスト画像（推奨サイズ `160x160` px）を配置し、`"avatar": "avatars/thumb/member_id.jpg"` のように指定します。ビルド時に Base64 Data URI として HTML 内に直接埋め込まれるため、HTML ファイル1つだけでどこでも画像が表示されます。
2. **画像未指定時の自動フォールバック**:
   `"avatar"` を省略したメンバーや画像ファイルがまだ存在しないメンバーには、所属企業のテーマカラーと名前のイニシャルを用いた円形SVG人物アイコンが自動生成されます。

## 複数組織が絡む指揮系統（親子ツリー）の定義

各部署（`departments[]`）の `members` 配列では：

- 先頭（`index 0`）のメンバーが部署の主担当（`"badge": "(主)"`）として上段に配置されます。
- 2人目以降のメンバーは `"parent": "<親メンバーのid>"` を指定することで、主担当または上位メンバーからの直属ツリー矢印が自動で結ばれます。所属組織（`org`）をメンバーごとに変えることで、複数社混成チームの系統を明確に表現できます。
