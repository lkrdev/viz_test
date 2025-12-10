/**
 * Jest test that fails if visualization code renders data values without using DrillableCell.
 *
 * This is a heuristic test (fast, regex-based). It scans .tsx files under template/src and test_app/src
 * and fails if a file appears to reference data cell properties (cell., rendered, row[...]) in JSX
 * but does not contain DrillableCell usage.
 *
 * The goal is to catch regressions where a developer outputs raw cell values instead of the
 * template DrillableCell wrapper.
 */

import fs from "fs";
import path from "path";

function collectFiles(dir: string, exts = [".tsx", ".ts", ".jsx", ".js"]): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...collectFiles(p, exts));
    } else {
      if (exts.includes(path.extname(e.name))) out.push(p);
    }
  }
  return out;
}

function fileViolates(filePath: string): boolean {
  const content = fs.readFileSync(filePath, "utf8");
  const hasDataRef = /\bcell\.|\brendered\b|\brow\[[^\]]+\]/.test(content);
  const hasJSX = /<[^>]+>/.test(content);
  const hasDrillable = /\bDrillableCell\b/.test(content);
  return Boolean(hasDataRef && hasJSX && !hasDrillable);
}

describe("DrillableCell usage", () => {
  const roots = ["template/src", "test_app/src"];
  const violatingFiles: string[] = [];

  for (const r of roots) {
    const files = collectFiles(r);
    for (const f of files) {
      if (fileViolates(f)) violatingFiles.push(f);
    }
  }

  test("no visualization file should render data values without DrillableCell", () => {
    if (violatingFiles.length > 0) {
      const message =
        "The following files appear to render data cells without using DrillableCell (heuristic):\n" +
        violatingFiles.map((f) => ` - ${f}`).join("\n") +
        "\nWrap displayed data values with DrillableCell to satisfy template requirements.";
      throw new Error(message);
    }
    expect(violatingFiles.length).toBe(0);
  });
});