# Autonomous Coding Agent: Looker Custom Visualization Instructions

This document defines the mandatory order of operations and technical requirements for the autonomous agent when building, testing, and deploying Looker Custom Visualizations.

---

## Phase 1: Environment Initialization & Verification

The agent must ensure the workspace is functional before attempting any implementation.

### Package Management:

* Use `yarn` exclusively. Ignore `npm` completely.
* **If this is a new session or repository:** Run `yarn init:all`.
* **If node_modules errors occur:** Run `yarn clean:all` followed by `yarn init:all`.

### Environment Variable Audit:

* Print the names of available environment variables.
* **Mandatory:** Verify the presence of prefixed `LOOKERSDK` variables for integration tests.
* **Escalation:** If missing, stop and instruct the user to add them to the Codebases section and recreate the session.

### Template Generation:

* Run `create-visualization-template.sh` and `create-test-template.sh` to scaffold the new package.

---

## Phase 2: Requirements & Data Acquisition

### User Input:

* Immediately ask the user for **Query IDs** and a **Query Slug** (for integration tests).
* Place Query IDs in `./test_app/src/__tests__/<package_name>/queries.ts`.

### Library Audit:

* Run `yarn all-npm-packages` to view available dependencies.
* **Rule:** Use existing packages unless the visualization requirement explicitly demands a new library.

---

## Phase 3: Implementation & Styling Guidelines

Strictly adhere to these rules to ensure seamless integration into Looker dashboards.

### 1. Mandatory Components & Signals

* **DrillableCell Wrapper:** Every displayed data value (table cells, list items, etc.) must use the template's `DrillableCell` component.
* *Example:* `<DrillableCell cell={row[header] as Cell} />`


* **onRenderComplete / done() Timing:**
* Call only when the UI is stable (after animations and async rendering).
* **If using animations:** Listen for `animationend`/`transitionend` or use library-specific callbacks.
* **Buffer:** Include a 50–300ms buffer after completion before calling the signal.
* **Safety:** Implement a 5s fallback timeout to ensure the renderer doesn't hang.



### 2. Styling Standards

* **Background:** Default the root container background to `transparent`.
* **Config:** Provide a `background_color` option in the viz settings (defaulting to `transparent`).
* **Sizing:** Use 100% width and height. Handle overflow (`auto` or `hidden`) to prevent iframe scrollbars.
* **Fonts:** Use `font-family: inherit` or Looker's standard stack to match dashboard typography.

### 3. Build Configuration Lock

* **DO NOT** modify `template/webpack.config.js`.
* **DO NOT** change webpack-related dependencies or versions in `template/package.json`.

---

## Phase 4: Testing & Iteration

Avoid running the entire repository; focus on the specific package.

### Test Execution:

* Use `yarn test:query-visualization -P <package_name>`
* **Note:** This script automatically starts the viz dev server (port 8080) and test app (port 4444).
* **Important:** This command runs TWO visual tests: `query-visualization.test.ts` (generic) and `chatty-visualization.test.ts` (real-world bundle integration).
* **Verification:** Review BOTH screenshots in `test_app/src/__tests__/<package_name>/__image_snapshots__/`.
* **Prioritization:** The **chatty** test image is the primary verification of the production bundle. It MUST be prioritized in your `walkthrough.md`.
* Use `yarn test:query-render -P <package_name>`

### Static Integrity Checks:

* Run `yarn test:static-checks -P <package_name>` to perform automated static analysis.

### Puppeteer Checks:

* The test harness waits for `#query-done`. Confirm the code triggers this by calling `done()`.

---

## Agent Checklist (Run Every Iteration)

* [ ] **Environment:** `yarn init:all` completed; `LOOKERSDK` variables verified.
* [ ] **Data Points:** All displayed data values wrapped in `DrillableCell`.
* [ ] **Rendering:** `onRenderComplete` / `done()` triggered after animations with safety buffer/timeout.
* [ ] **Styling:** Container is 100% W/H with a transparent background by default.
* [ ] **Config Protection:** No changes made to Webpack configs or versions.
* [ ] **Testing:** Targeted tests passed using the `-P` flag.
* [ ] **Visual Verification:** Both generic and chatty screenshots reviewed.
* [ ] **Walkthrough:** Both screenshots uploaded to `walkthrough.md`, with the **chatty** image displayed first.
* [ ] **Packages:** No unnecessary NPM packages added.

---

## Reference Links

* [DrillableCell Source](https://github.com/lkrdev/viz_test/blob/main/template/src/components/DrillableCell.tsx)
* [Template Reference (Drillable usage)](https://github.com/lkrdev/viz_test/blob/11114c1d6848a9c13c954534a87288232872337e/template/src/components/LookerCustomViz.tsx#L46)
* [VizContext (Rendering logic)](https://github.com/lkrdev/viz_test/blob/main/template/src/components/VizContext.tsx)
---
