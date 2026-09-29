# tt-a1i/archify で作るマルチ組織・アバター付き「プロジェクト体制図」自動生成ツール archify-org-chart

![Archify Org Chart Header Banner](./assets/header-banner.svg)

## 1. 複数組織が関わるプロジェクト体制図の課題

日本のシステム開発プロジェクトでは、発注元の事業部、全体を統括するプライムベンダ、AIアルゴリズムを開発する専門パートナー、クラウド基盤や監視を担うSREパートナーなど、複数の企業が1つの推進体制を組む形態が珍しくない。参画する各企業のメンバーは会社単位で独立して動くのではなく、「開発T」や「運用T」といった機能別の部署（チーム）の中に混在して配置される。

しかし、スライド作成ソフトや表計算ソフトで作る従来の体制図では、同一部署内に複数企業のメンバーが混在したときに指揮系統と所属企業の境界を同時に読み取りにくい。従来の定型フォーマットは、頂点の「プロジェクトオーナー」から右分岐の「プロジェクトマネジメント」を経て下部の4部署（事業部・開発T・運用T・品質管理T）へ枝分かれし、左端の「部署・担当者・ロール」の3段枠に沿って主担当（`(主)`）とメンバー（`┗`）を並べる構造をとる。この枠組みの中に複数社のメンバーを文字だけで列挙すると、誰がどの企業に所属し、誰の直属系統（`(主)` ➔ `┗`）として動くのかが視覚的に埋もれてしまう。

これに対し、MermaidやGraphvizなどの汎用グラフ描画ツールを使えば、ノード間の親子関係や矢印はコードから自動描画できる。ところが、汎用グラフ描画ツールには、日本の開発現場で求められる「部署・担当者・ロール」の3段枠を定型レイアウトとして重ねる機能がなく、各担当者の名前の横に顔写真（円形アバター）を配置してメンバーの顔を判別しやすくする表現も標準では備わっていない。定型の3段マトリクス枠、複数企業を横断するツリー系統、全メンバーのアバター表示の3つを単一の図面で両立するには、専用のレイアウト計算とSVG合成の仕組みが必要になる。

---

## 2. `tt-a1i/archify` と `archify-org-chart` の全体像

この課題の土台となる描画エンジンが、JSON形式の仕様ファイルからアーキテクチャ図やワークフロー図を生成する [`tt-a1i/archify`](https://github.com/tt-a1i/archify) である。`tt-a1i/archify` は、ノードの座標や接続関係を記述したJSONを入力として受け取り、ダーク/ライト切り替えやフォーカスビューを備えた単一HTML（インラインSVG内包）を出力する。ビルド時に `--quality showcase` オプションを指定すると、ラベルの重なり、矢印とノードの交差、接続端点の進入方向（`clean-flow/endpoint-side-direction`）などを自動で検査し、レイアウト崩れを検出する仕組みを備えている。

その `tt-a1i/archify` を描画エンジンとして組み込み、1つの宣言的JSON（`*.org.json`）からマルチ組織対応のプロジェクト体制図を生成するCLIツールおよびテンプレート集が [`Sunwood-ai-labs/archify-org-chart`](https://github.com/Sunwood-ai-labs/archify-org-chart) である。開発者がJSONファイルに参加企業、オーナー、PM、4部署のメンバーと担当ロールを記述してビルドコマンドを実行すると、定型の階層ツリー型体制図とマルチ組織スイムレーン図が単一HTMLとして出力される。生成されたSVG内の全人物ノードおよびページ下部の体制図ボードには、各担当者の名前のすぐ横に円形アバターが自動で埋め込まれる。

実際の出力結果とブラウザ上でのインタラクティブな操作は、GitHubリポジトリおよびGitHub Pages上のライブデモで確認できる。

- **GitHubリポジトリ**: [https://github.com/Sunwood-ai-labs/archify-org-chart](https://github.com/Sunwood-ai-labs/archify-org-chart)
- **日本語ドキュメント＆ライブデモ**: [https://sunwood-ai-labs.github.io/archify-org-chart/ja/](https://sunwood-ai-labs.github.io/archify-org-chart/ja/)

---

## 3. 生成される2種類の図面（階層ツリー体制図とスイムレーン図）

### 3.1 4部署×3段枠を備えた階層ツリー型体制図

1つ目の出力図面は、定型の「部署・担当者・ロール」の3段構成を踏襲した階層ツリー型体制図（`project-governance-with-avatars.html`）である。付属のサンプルデータ（`examples/ai-retail-dx.org.json`）では、発注元の株式会社ネクストリテール、プライムベンダのアークシステムズ株式会社、AIパートナーの株式会社イロドリAIラボ、SREパートナーのクラウドフォージ株式会社の4社・全12名による「次世代AI店舗DXプロジェクト」の体制を描いている。頂点の佐藤オーナー（ネクストリテール）から下へ伸びる主幹は、途中で右側の鈴木PM（アークシステムズ）へ分岐したのち、下段の4部署（`事業部`・`開発T`・`運用T`・`品質管理T`）の各主担当へとつながる。

![階層ツリー型体制図（Dark Blueprint）](./assets/preview-dark.png)

![階層ツリー型体制図（Light 印刷対応）](./assets/preview-light.png)

この階層ツリー図では、同一部署内で複数企業へ枝分かれする指揮系統がノードの色分けと矢印の接続によって一目で判別できる。たとえば中央左の「開発T」では、アークシステムズの田中主担当（`(主)`、エメラルド枠）の下に、同じアークシステムズのUI・API実装担当である山本（`┣ 田中系統`）と、外部パートナーであるイロドリAIラボの渡辺（`(AI主)`、パープル枠）が並列にぶら下がり、渡辺の直下に同社の小林（`┗ 渡辺系統`、RAG・精度検証）が連なる。各人物ノードの左端には所属企業カラーのリングで縁取られた円形アバターが並び、右上の企業略称タグと合わせて「誰がどの会社のメンバーで、誰の直属ラインにいるか」を迷わず追える。

出力されたHTMLは、画面右上のトグルボタンでダーク・ブループリント表示と印刷向けのライト表示を即座に切り替えられる。画面上部のビュー切り替えタブ（「① オーナー＆PM主幹ツリー」「② 事業部ツリー系統」「③ 開発Tツリー系統」「④ 運用T・品質管理Tツリー系統」）を選択すると、該当する指揮系統のノードと矢印だけがハイライトされ、会議中の説明箇所に応じたフォーカス表示が可能になる。

### 3.2 4社の責任境界と工程を追うマルチ組織スイムレーン図

2つ目の出力図面は、同じ4社・12名のメンバーを「所属企業のレーン（縦軸）×プロジェクトの進行フェーズ（横軸）」に再配置したマルチ組織スイムレーン図（`org-lineage-swimlane-with-avatars.html`）である。階層ツリー図が組織の静的な指揮系統と役割分担を示すのに対し、スイムレーン図は予算委任から設計、実装、SRE監査、品質ゲート、受入テスト（UAT）に至る業務の引き渡し順序を表す。

![マルチ組織スイムレーン図（Dark）](./assets/swimlane-dark.png)

具体的には、最上段の「事業部：ネクストリテール」レーンで佐藤オーナーから高橋主担当へ「予算委任」が行われ、2段目の「PM/開発/QA：アークシステムズ」レーンの鈴木PMへ「開発委託」として渡る。続いて開発・運用フェーズに入ると、鈴木PMから田中（開発T主担当）へ「開発T指揮」、4段目の「運用T：クラウドフォージ」レーンの中村（運用T主担当）へ「運用T指揮」がそれぞれ出され、田中から3段目の「開発T(AI)：イロドリAIラボ」レーンの渡辺・小林ラインへ「AI委託」が分岐する。最終的に、社内App実装（山本）、AI精度報告（小林）、SRE基盤監査（加藤）の3系統がすべてアークシステムズ品質管理Tの伊藤・松本へ合流し、品質ゲート審査を経て最上段の佐々木（事業部UAT）へ引き渡される流れが一枚の図で完結する。

---

## 4. 宣言的 JSON からアバター付き SVG を合成する仕組み

### 4.1 5つのセクションから成る設定 JSON スキーマ

利用者が編集する設定ファイル（`*.org.json`）は、座標やSVG要素を含まない宣言的なデータ構造になっている。スキーマはプロジェクト名を示す `projectTitle`、参画企業の色と種別を定義する `organizations`、頂点の `owner`、右分岐の `pm`、そして4部署のメンバー階層と役割リストを格納する `departments` の5セクションで構成される。

```json
{
  "projectTitle": "次世代AI店舗DXプロジェクト プロジェクト体制図",
  "organizations": {
    "next_retail": { "name": "株式会社ネクストリテール（発注元）", "short": "ネクストリテール", "type": "frontend", "color": "#38bdf8" },
    "ark_systems": { "name": "アークシステムズ株式会社（プライム）", "short": "アークシステムズ", "type": "backend", "color": "#10b981" },
    "irodori_ai":  { "name": "株式会社イロドリAIラボ（AIパートナー）", "short": "イロドリAIラボ", "type": "cloud", "color": "#a855f7" }
  },
  "owner": {
    "id": "sato_sponsor", "name": "佐藤 健一", "title": "プロジェクトオーナー",
    "department": "(事業部)", "role": "執行役員 / 統括オーナー",
    "org": "next_retail", "avatar": "../avatars/thumb/sato_sponsor.jpg"
  },
  "departments": [
    {
      "id": "dept_dev",
      "name": "開発T",
      "headerColor": "#059669",
      "members": [
        { "id": "tanaka_arch",   "name": "田中 翔太", "badge": "(主)",   "role": "開発T 主担当 / 全体設計",   "org": "ark_systems", "parent": "suzuki_pm",   "avatar": "../avatars/thumb/tanaka_arch.jpg" },
        { "id": "yamamoto_dev",  "name": "山本 拓海", "badge": "",       "role": "┣ 田中系統 / UI・API実装",  "org": "ark_systems", "parent": "tanaka_arch", "avatar": "../avatars/thumb/yamamoto_dev.jpg" },
        { "id": "watanabe_ai",   "name": "渡辺 蓮",   "badge": "(AI主)", "role": "┗ 田中系統 / Agent設計",    "org": "irodori_ai",  "parent": "tanaka_arch", "avatar": "../avatars/thumb/watanabe_ai.jpg" },
        { "id": "kobayashi_eval","name": "小林 結衣", "badge": "",       "role": "┗ 渡辺系統 / RAG・精度検証","org": "irodori_ai",  "parent": "watanabe_ai", "avatar": "../avatars/thumb/kobayashi_eval.jpg" }
      ],
      "roles": [
        "・システム全体アーキテクチャ設計",
        "・店舗向けフロントUI / API実装",
        "・マルチエージェント推論基盤開発",
        "・RAGデータ構築・LLM精度検証"
      ]
    }
  ]
}
```

各メンバーの定義では、`org` フィールドで所属企業のキーを指定し、`parent` フィールドで直属の上位メンバーの `id` を指定する。上記の「開発T」の例であれば、`yamamoto_dev` と `watanabe_ai` の双方の `parent` に `tanaka_arch` を指定し、`kobayashi_eval` の `parent` に `watanabe_ai` を指定するだけで、2社にまたがる2段階の分岐構造が定義される。

### 4.2 メンバー数に応じた座標算出とルーティング制御

CLI本体である `bin/archify-org-chart.mjs` の `generateArchitectureSpec` 関数は、`*.org.json` を読み込んで `tt-a1i/archify` 用のアーキテクチャ仕様JSONに変換する。この変換処理では、4つの部署カラムの横幅とX座標をあらかじめ定義したうえで、各部署に属するメンバーの人数に応じて配置と矢印のルーティング方式を切り替えている。

```javascript
const colLayout = [
  { leadX: 84, subXs: [84], width: 156 },
  { leadX: 374, subXs: [290, 462], width: 156, subWidth: 152 },
  { leadX: 664, subXs: [664], width: 156 },
  { leadX: 870, subXs: [870], width: 156 }
];

// メンバー数とインデックスに応じた座標・ルート種別の決定
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
```

メンバーが主担当と担当者の2名のみで構成される部署（事業部・運用T・品質管理T）では、2人を同じX座標（`layout.leadX`）の上下に並べて `route: 'straight'`（垂直直線）で結ぶ。一方、開発Tのように3名以上が左右に枝分かれする部署では、2人目と3人目を左右のサブカラム（`subXs: [290, 462]`）に振り分け、標準の直交ブリッジルートで接続し、4人目（`mIdx >= 3`）を右サブカラムの直下に配置して再び `route: 'straight'` で結ぶ。このように直線ルートと直交ルートを人数と階層位置に応じて使い分ける理由は、`tt-a1i/archify` の `--quality showcase` 検査に含まれる `clean-flow/endpoint-side-direction`（矢印がノードの指定された辺に対して垂直に進入しているか）の検証をエラーなく通過させるためである。

### 4.3 SVG ノードへの円形アバター注入とテキスト座標の再計算

`tt-a1i/archify` が標準で出力する人物ノードには汎用的なSVG記号（`data-semantic-sigil`）が配置され、ラベル文字列は中央揃え（`text-anchor="middle"`）で描画される。後処理スクリプトの `inject-avatars.mjs` は、生成されたHTML内の各 `<g id="node-...">` ブロックを正規表現で走査し、この汎用記号を `<clipPath>` で円形にくり抜いた `<image>` 要素（Base64 Data URI形式）に置き換える。

```javascript
const r = isWorkflow ? 14.5 : 18.0;
const cx = +(x + 6 + r).toFixed(2);
const cy = +(y + h / 2).toFixed(2);
const textStartX = +(x + 6 + r * 2 + 6).toFixed(2);

clipDefs.push(
  `<clipPath id="avatar-clip-${m.id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>`
);

const avatarSvg = `<g aria-hidden="true" class="node-avatar-group">
  <circle cx="${cx}" cy="${cy}" r="${+(r + 1.6).toFixed(2)}" fill="#0f172a" stroke="${m.color}" stroke-width="2"/>
  <image href="${avatarDataUris[m.id]}" x="${+(cx - r).toFixed(2)}" y="${+(cy - r).toFixed(2)}" width="${+(r * 2).toFixed(2)}" height="${+(r * 2).toFixed(2)}" clip-path="url(#avatar-clip-${m.id})" preserveAspectRatio="xMidYMid slice"/>
</g>`;
```

単にノードの左端へ円形アバターを配置しただけでは、中央揃えの氏名テキストや役職サブタイトルがアバター画像と重なってしまう。そこで `inject-avatars.mjs` は、ノード矩形の左端座標 `x` とアバター半径 `r`（体制図では `18.0px`、スイムレーン図では `14.5px`）からテキスト開始位置 `textStartX = x + 6 + r * 2 + 6` を算出し、氏名・役職・企業タグの全 `<text>` 要素を左揃え（`text-anchor="start"`）に書き換えて右へシフトさせる。設定JSONで `avatar` 画像が指定されていないメンバーや画像ファイルが存在しない場合には、`buildAvatarDataUri` 関数が所属企業カラーの人物シルエットと氏名の先頭2文字を入れたSVGアイコンを動的に生成し、Base64化して埋め込むフォールバック処理を行う。

### 4.4 「部署・担当者・ロール」枠を合成する際の SVG レイヤー順序制御

アバター注入と並行して、`inject-avatars.mjs` は日本の体制図で求められる左端の行見出し（「部署」「担当者」「ロール」）、4部署のヘッダーバー、および下段のロール一覧ボックスを `<g class="template-structure-overlay">` としてSVG内に挿入する。この際、SVGの `viewBox` の高さを `836px` に拡張し、4つの部署フレーム（`data-graph-role="structural-frame"`）の高さを `362px` に揃えたうえで、凡例（Legend）を `116px` 下方へ移動させてロール一覧ボックスと重ならないように配置する。

この構造オーバーレイを挿入するDOM上の位置は、幹線矢印（Connections）の描画グループよりも後、かつ人物ノード群の開始コメントである `<!-- Components -->` の直前に固定されている。もし構造オーバーレイをSVGの先頭（矢印の背面）に配置すると、オーナーやPMから各部署の主担当へ向かう幹線矢印が「部署」見出しバーの上を横切り、白い部署名テキストの上に線が重なって視認性を損ねる。これに対し、`<!-- Components -->` の直前に見出しバーを挿入すれば、背景から伸びてきた幹線矢印が見出しバーの背後に隠れ、見出しバーの下端から人物ノードへ向かって矢印が抜ける自然な重なり順になる。

---

## 5. 3ステップで自分のプロジェクト体制図を作る手順

手元の環境で独自のプロジェクト体制図を作成する作業は、リポジトリのセットアップ、スターターJSONの編集、ビルドコマンド実行の3ステップで完了する。実行環境には Node.js 20以上と Git が必要になる。

### 5.1 リポジトリのクローンと描画エンジンの取得

最初にリポジトリをクローンし、`npm run setup:archify` を実行して固定コミットの `tt-a1i/archify` エンジンを `.cache/archify` に取得する。

```bash
git clone https://github.com/Sunwood-ai-labs/archify-org-chart.git
cd archify-org-chart
npm run setup:archify
```

### 5.2 スターターテンプレートのコピーと編集

次に、穴埋め用のテンプレート `templates/starter.org.json` を任意のファイル名でコピーし、プロジェクト名、参加企業、各部署のメンバー名と `parent` ID、および担当ロールの箇条書きを書き換える。顔写真を用意する前の段階では、`avatar` フィールドを空文字列（`""`）のままにしておけば、所属企業カラーのイニシャルアイコンが自動生成される。

```bash
cp templates/starter.org.json my-project.org.json
```

### 5.3 単一 HTML のビルドと共有

最後に `bin/archify-org-chart.mjs` の `build` コマンドを実行すると、`tt-a1i/archify` のレイアウト検証と `inject-avatars.mjs` のアバター・3段枠合成が順に実行され、単一HTMLファイルが出力される。

```bash
# 独自の体制図JSONから単一HTMLをビルド
node bin/archify-org-chart.mjs build my-project.org.json my-project.html

# 付属の4社横断サンプルとスイムレーン図を一括ビルドする場合
npm run build
```

出力された `my-project.html` には、SVG図面、Base64化されたアバター画像、ライト/ダーク切り替えUI、およびページ下部のHTML版体制図ボードがすべて1ファイルに収められており、ブラウザでそのまま開くほか、社内Wikiやチャットツールへ単一ファイルとして添付・共有できる。
