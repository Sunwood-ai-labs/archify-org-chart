import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Archify Org Chart',
  description: 'Multi-Organization Project Governance & Avatar Lineage Tree Generator powered by tt-a1i/archify',
  base: '/archify-org-chart/',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/archify-org-chart/logo.svg' }]
  ],
  themeConfig: {
    logo: '/logo.svg',
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Sunwood-ai-labs/archify-org-chart' }
    ]
  },
  locales: {
    root: {
      label: 'English',
      lang: 'en-US',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/' },
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Config Schema', link: '/guide/schema' },
          { text: 'Live Demo (Tree)', link: '/demo/project-governance.html', target: '_blank' },
          { text: 'Live Demo (Swimlane)', link: '/demo/workflow-swimlane.html', target: '_blank' }
        ],
        sidebar: [
          {
            text: 'Guide',
            items: [
              { text: 'Getting Started', link: '/guide/getting-started' },
              { text: 'Config Schema & Avatars', link: '/guide/schema' }
            ]
          }
        ]
      }
    },
    ja: {
      label: '日本語',
      lang: 'ja-JP',
      link: '/ja/',
      themeConfig: {
        nav: [
          { text: 'ホーム', link: '/ja/' },
          { text: 'クイックスタート', link: '/ja/guide/getting-started' },
          { text: '設定スキーマ＆アバター', link: '/ja/guide/schema' },
          { text: 'ライブデモ（体制図）', link: '/demo/project-governance.html', target: '_blank' },
          { text: 'ライブデモ（スイムレーン）', link: '/demo/workflow-swimlane.html', target: '_blank' }
        ],
        sidebar: [
          {
            text: 'ガイド',
            items: [
              { text: 'クイックスタート', link: '/ja/guide/getting-started' },
              { text: '設定スキーマ＆アバター', link: '/ja/guide/schema' }
            ]
          }
        ]
      }
    }
  }
});
