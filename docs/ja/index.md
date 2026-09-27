---
layout: home

hero:
  name: Archify Org Chart
  text: マルチ組織・アバター付き「プロジェクト体制図」生成ツール
  tagline: JSONファイル1つから、顔写真アバターと複数企業の指揮系統ツリーを備えたインタラクティブなプロジェクト体制図を自動生成します。
  image:
    src: /logo.svg
    alt: Archify Org Chart
  actions:
    - theme: brand
      text: クイックスタート
      link: /ja/guide/getting-started
    - theme: alt
      text: ライブデモ（体制図）を開く
      link: /demo/project-governance.html
      target: _blank
    - theme: alt
      text: English Docs
      link: /

features:
  - title: 🏛️ 王道の階層ツリー型「プロジェクト体制図」
    details: 頂点に「プロジェクトオーナー (事業部)」、右分岐に「プロジェクトマネジメント」、下部に4部署（事業部 / 開発T / 運用T / 品質管理T）と「部署・担当者・ロール」の3段構成を忠実に再現。
  - title: 👤 全員の名前横に円形アバターを表示
    details: SVG内の人物ノードおよび下部HTMLボードの両方で、名前のすぐ横に円形ポートレートアバター（画像または自動SVGアイコン）を埋め込みます。
  - title: 🔗 複数組織が絡む指揮系統を一目で把握
    details: 発注元・プライム・AIパートナー・SREパートナーなど複数企業が混在するチームでも、誰が誰の直属系統（(主) ➔ ┗）かを色分けとツリー線で可視化します。
  - title: ⚡ 単一HTMLファイル出力（tt-a1i/archify 駆動）
    details: ダーク/ライト切替、系統別ガイド再生、経路探索、A4/A3横向き印刷スタイルを備えた単一HTMLファイルを出力します。
---

## 🖼️ プレビュー

### ダーク・ブループリント表示

![プロジェクト体制図 ダークモード](/preview-dark.png)

### ライト・印刷対応表示

![プロジェクト体制図 ライトモード](/preview-light.png)
