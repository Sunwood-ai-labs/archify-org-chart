# 🚀 クイックスタート

**Archify Org Chart** を使えば、1つの JSON 設定ファイル（`*.org.json`）を編集するだけで、アバター付きの**「プロジェクト体制図」**を誰でも簡単に作成できます。

## 1. リポジトリのクローン

```bash
git clone https://github.com/Sunwood-ai-labs/archify-org-chart.git
cd archify-org-chart

# Node.js 20以上とGitが必要です。固定版の描画エンジンを取得します。
npm run setup:archify
```

## 2. 体制図設定ファイル（`*.org.json`）の作成

穴埋め用のスターターテンプレート（`templates/starter.org.json`）をコピーして自分のプロジェクト用に編集します：

```bash
cp templates/starter.org.json my-project.org.json
```

`my-project.org.json` 内の以下の項目を書き換えます：

- **`projectTitle`**: 体制図の上部バナータイトル（例：`□□□□ プロジェクト プロジェクト体制図`）
- **`organizations`**: 参加する企業・組織とテーマカラー
- **`owner`**: 頂点のプロジェクトオーナー（`name`, `role`, `avatar`）
- **`pm`**: 右分岐のプロジェクトマネジメント主担当・補佐メンバー
- **`departments`**: 4部署（`事業部`, `開発T`, `運用T`, `品質管理T`）の各担当者（`name`, `(主)` バッジ, 親ノード `parent`, `avatar` 画像パス）と、各部署の担当 `roles`（`・役割1...`）。

## 3. インタラクティブ HTML のビルド

```bash
# デフォルトの4社横断・全12名ショーケースをビルド
npm run build

# 作成したカスタムJSONから体制図HTMLを生成
node bin/archify-org-chart.mjs build my-project.org.json my-project.html
```

生成された `project-governance-with-avatars.html`（または `my-project.html`）をブラウザで開いてください。

## 4. インタラクティブ機能の活用

- **Guided Views（系統別ハイライト）**: 上部のチャプターボタン（`① オーナー＆PM主幹ツリー`、`② 事業部ツリー系統`、`③ 開発Tツリー系統`、`④ 運用T・品質管理Tツリー系統`）で特定の指揮系統だけをフォーカス表示できます。
- **ダーク / ライト＆プリセット切替**: 右上のツールバーから `Dark / Light` や `Blueprint / Signal Flow / Editorial` を切り替えたり、そのまま印刷（横向きA4/A3）が可能です。
- **下部テンプレート準拠ボード連動**: ページ下部にも王道テンプレート形式の体制図ボードが収録されており、人物カードをクリックすると上部SVGの該当人物ノードへフォーカスします。

## 🔧 生成・公開の仕組み

- 初回は必ず `npm run setup:archify` を実行してください。描画エンジンを固定コミットで `.cache/archify` に取得します。既存のエンジンを使う場合は環境変数 `ARCHIFY_CLI` に `archify.mjs` の絶対パスを指定できます。
- アバターの相対パスは **JSONファイルのあるフォルダー基準**です。例の `examples/` 内では `../avatars/thumb/sato_sponsor.jpg`、リポジトリ直下の設定なら `avatars/thumb/sato_sponsor.jpg` とします。
- `npm run build:starter` でイニシャル画像のスターターを生成できます。カスタム出力と同名の `.architecture.json` も保存されます。既存のサンプルやスイムレーンは書き換えません。
- `npm run build:demos` は両デモを再生成し、公開ディレクトリへ同期します。スイムレーンは専用の `org-lineage-swimlane.workflow.json` から生成する固定サンプルです。
- 表形式の体制図はページ末尾の「プロジェクト体制図を表で見る」から開きます。PM補佐は表に表示され、図にも同じIDがあれば選択できます。
- 図の固定操作UIは英語です。日本語の人物名・説明と日英ドキュメントを提供します。
- 生成後のHTMLは共有できます。生成・プレビューには外部フォントの読み込みが発生する場合がありますが、図とアバターのデータはHTMLに埋め込まれます。
