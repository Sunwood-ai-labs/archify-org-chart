# Contributing

Use Node.js 20 or newer and Git. No root npm dependencies are required.

```sh
npm run setup:archify
npm test
npm run build:starter
npm run build:demos
npm --prefix docs ci
npm run docs:build
npm --prefix docs run docs:preview -- --host 127.0.0.1
```

Edit organization data in `examples/ai-retail-dx.org.json`, the standalone
swimlane in `org-lineage-swimlane.workflow.json`, and rendering extensions in
`src/` and `inject-avatars.mjs`. Do not hand-edit generated HTML. Commit regenerated
root/demo HTML together. Update both language guides when behavior changes.

The layout is deliberately bounded: four departments, at most four members in
column two and two elsewhere. Keep all member IDs stable and parent references
accurate. Do not publish real personnel information or portraits without the
appropriate authorization.

Inspect both demos in dark/light mode and expand the organization board. Verify
avatar loading, focus, search, keyboard selection, and mobile wrapping. Automated
and ordinary browsers must receive the same content. Include the checks and
any known limitations in the pull request.

CI checks Windows and Linux. The Pages workflow runs regression tests,
regenerates demos, builds the locked docs dependencies, and publishes `main`.
