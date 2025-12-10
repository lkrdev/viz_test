# Setup

- use yarn for everything, forget that npm exists.
- if this is your first time running this repository, you can use `yarn init:all` to initialize all the packages and dependencies.
- if you think you have a problem with node_modules and installed packages, use `yarn clean:all` to clean everything and re-initialize.
- if you are creating a new package, use the create-test-template.sh script to create the test template.

# Editing

- the top level package.json should not have any dependencies, it should only have scripts.
- When developing a new or existing visualization, ask the Jules user for query ids. Query ids should be placed in `./test_app/src/__tests__/<package_name>/queries.ts` when provided.

# Testing

- do not use `yarn test:query-visualization --all` or `yarn test:query-render --all` (these run the whole repo). When testing a specific visualization use `yarn test:query-visualization -P <package_name>` or `yarn test:query-render -P <package_name>`.

# Building a new visualization

- Start with `create-test-template.sh` and `create-visualization-template.sh` to create the test template.

# When to use new packages

- Unless explicitly requested, try to meet requirements using packages already installed. Use `yarn all-npm-packages` to view available packages across the repo.

---

# Agent Requirements (mandatory checks & behavior)

These rules must be enforced by the automated agent before running tests or opening a PR.

1) Wrap displayed data points with DrillableCell
- Every displayed data value (table cells, list items, inline values, etc.) must render using the template's `DrillableCell` component instead of plain text or custom anchor elements.
- If a custom cell component is used, ensure the clickable/drillable content is implemented with `DrillableCell` (example: `<DrillableCell cell={row[header] as Cell} />`).
- Rationale: `DrillableCell` centralizes drill menu behavior and accessible keyboard handling; tests and Looker expect that behavior.

2) Call done()/onRenderComplete() only after mount and after animations/async rendering finish
- Ensure the provided `onRenderComplete` or `done` callback is called only when the UI is fully stable:
  - If there are no animations/async effects, call `onRenderComplete?.()` on mount/update when rendering is complete.
  - If animations/transitions/async work are present, wait for their completion (use `animationend`/`transitionend` events or Promises/callbacks provided by the library), then call `onRenderComplete?.()` with a small buffer (50–300ms).
- Recommended React pattern:
  - Use `useEffect` watching `data`, `config`, and `onRenderComplete`.
  - Attach listeners for `animationend`/`transitionend` or await animation Promises, then call `onRenderComplete?.()`; include a fallback timeout (e.g., 5s) to avoid blocking indefinitely.
- Rationale: the test harness and Looker export renderer rely on this signal to mark the viz as finished; snapshots and exports depend on it.

3) Do NOT change webpack config or webpack versions
- Do not edit `template/webpack.config.js`.
- Do not change webpack-related dependencies in `template/package.json` (webpack, webpack-cli, webpack-dev-server, `@webpack-cli/*`, etc.) or their versions.
- If a webpack change seems necessary, open an issue or ask a repository maintainer instead of making automated changes in a branch/PR.
- Rationale: CI, dev servers, and workflow depend on the template webpack config and pinned versions; changes can break builds and tests.

---

# Additional agent checks & recommended automation

- Static checks (pre-test & pre-PR):
  - Fail if any new/modified visualization file edits `webpack` files or modifies webpack deps in package files.
  - Verify that JSX/TSX rendering data cells imports and uses `DrillableCell`.
  - Verify that `useViz` or `onRenderComplete`/`done` is referenced and used properly (or contains an explicit waiting/fallback comment).
- Runtime checks:
  - Keep Puppeteer snapshot tests but add a pre-screenshot assertion to confirm `done`/`onRenderComplete` has been called (the harness already waits for `#query-done`).
  - Add a visual smoke test that detects DrillableCell-like clickable elements (e.g., `role="button"` or a known drillable class/selector).
- CI gating:
  - Block PRs that change `template/webpack.config.js` or update webpack versions without maintainer review (file-change detector).
  - Block PRs that fail the static grep heuristics for drillable wrappers or render-complete signals.
- Developer guidance:
  - Use template components (`DrillableCell`, `VizProvider`, etc.) rather than re-implementing those behaviors.
  - When adding third-party charting libraries that animate, hook their animation-complete callbacks to `onRenderComplete`.
- Tests and timeouts:
  - Do not rely solely on arbitrary sleep buffers in tests; ensure visualizations explicitly signal completion. Use buffers only as a safety net.

---

# References (key files)

- DrillableCell component:
  - https://github.com/lkrdev/viz_test/blob/11114c1d6848a9c13c954534a87288232872337e/template/src/components/DrillableCell.tsx
- Template viz showing DrillableCell usage and onRenderComplete:
  - https://github.com/lkrdev/viz_test/blob/11114c1d6848a9c13c954534a87288232872337e/template/src/components/LookerCustomViz.tsx
- VizContext and onRenderComplete wiring:
  - https://github.com/lkrdev/viz_test/blob/11114c1d6848a9c13c954534a87288232872337e/template/src/components/VizContext.tsx
- Where the Looker plugin wires `done()` to React:
  - https://github.com/lkrdev/viz_test/blob/11114c1d6848a9c13c954534a87288232872337e/template/src/custom_viz_container.tsx
- Template webpack config (do not change):
  - https://github.com/lkrdev/viz_test/blob/11114c1d6848a9c13c954534a87288232872337e/template/webpack.config.js
- Template package.json (webpack versions; do not change):
  - https://github.com/lkrdev/viz_test/blob/11114c1d6848a9c13c954534a87288232872337e/template/package.json
- Test harness that expects a `#query-done` marker:
  - https://github.com/lkrdev/viz_test/blob/11114c1d6848a9c13c954534a87288232872337e/test_app/src/__tests__/query-visualization.test.ts

---

# Agent checklist (run every iteration)
- [ ] Ensure every displayed data value is rendered via `DrillableCell`.
- [ ] Ensure `onRenderComplete`/`done` is called only after mount + animations/async finish (use event listeners or library callbacks; include a small buffer).
- [ ] Do not modify `template/webpack.config.js` or webpack dependency versions in template package files; open an issue if a change is required.
- [ ] Run static checks (grep for `DrillableCell`; grep for `onRenderComplete` or `done` usage).
- [ ] Run unit and visual tests; do not open a PR if any of the above fail.