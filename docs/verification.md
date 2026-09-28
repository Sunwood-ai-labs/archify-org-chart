# Verification record

Checked locally on 2026-09-28. This page distinguishes engine validation from
the additional avatar/board extension and browser review.

## Generator and publishing

- Six Node regression tests pass: configured reporting edges, invalid input,
  escaped fallback images, custom config/relative avatar handling in a temporary
  directory, invalid commands, and missing-engine output preservation.
- Showcase and starter build successfully with the pinned Archify revision.
- Both base diagrams pass Archify `deliver`: 9/9 artifact checks, no composition
  errors or warnings. These receipts apply to the base diagrams; the avatar and
  board extension is applied afterwards and checked separately.
- VitePress builds the English/Japanese site. Pages rebuilds the demos instead
  of relying on potentially stale copied HTML.
- The generated tree, swimlane and their public demo copies are byte-identical.

## Browser review

- The tree has 12 embedded SVG portrait images. All 13 board images load (one
  person appears twice because of the PMO/QA dual assignment).
- Light/dark themes, the expandable board, and Enter-key selection from a
  member card were exercised in the browser.
- Desktop widths 1440, 1600, 1920 and 2048 show no horizontal document overflow.
- At 390×844 the board becomes a vertical list and the toolbar wraps; visible
  toolbar buttons stay within the viewport.
- README preview images were refreshed from the current tree.

## Display limits

This is a dense, vertically scrolling chart with an optional expanded table.
The upstream `visual-check` one-screen containment criterion **does not pass**
for the base tree: it requires vertical scrolling at the four desktop sizes.
This is not reported as a full Archify visual-check pass. The avatar extension
also uses vertical scrolling. No content is clipped to manufacture a pass.

The template supports exactly four departments, with up to four members in the
second column and two in each other column. PM-only assistants appear in the
board rather than as new SVG nodes. Larger structures require a new layout.

CI and deployment results for each revision are available in
[GitHub Actions](https://github.com/Sunwood-ai-labs/archify-org-chart/actions).
