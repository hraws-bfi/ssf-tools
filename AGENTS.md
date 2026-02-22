# AGENTS.md

## Project Overview
- Repository purpose: sync readset metadata from Go services and visualize/check doc revisions.
- Primary runtime: Node.js (CommonJS), no build step.
- Main UI: `index.html` served as static page.

## Key Files
- `sync-core.js`: readset/constants extraction logic from Go source.
- `sync-readset.js`: generic sync entrypoint (interactive system picker + optional `<system-key>` arg).
- `sync-runner.js`: interactive repo path prompt + system resolution.
- `dev-server.js`: local static dev server.
- `systems.config.json`: source of truth for supported systems and output files.
- `public/readset-output-*.json`: UI-consumed datasets.

## Common Commands
- Install deps: `npm install`
- Run dev server: `npm run dev`
- Add system: `npm run add-readset-system`
- Sync system (interactive picker + interactive path prompt): `npm run sync-readset`
- Sync system directly by key: `npm run sync-readset -- <system-key>`

## Editing Guidelines
- Keep changes minimal and targeted.
- Preserve current output schema used by `index.html`:
  - top-level: `system`, `extractedAt`, `gitInfo`, `searchPaths`, `totalFiles`, `totalReadSets`, `totalConstants`, `readSets`, `constants`
- Avoid introducing build tooling unless explicitly requested.
- Prefer defensive checks for user-pasted JSON in the UI.

## Data + UI Notes
- Readset checker loads systems dynamically from `systems.config.json`.
- Sync writes output only to `public/readset-output-<system>.json`.
- A system appears in dropdown only when its output file exists and is loadable.

## Validation
- Syntax check: `node --check sync-core.js sync-readset.js sync-runner.js add-readset-system.js dev-server.js`
- If changing parsing logic, verify with multiple systems and inspect output counts.

## Known Gaps
- `npm test` currently points to missing `test.js`.
- No automated CI quality checks beyond Pages deploy.
