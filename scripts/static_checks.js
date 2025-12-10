#!/usr/bin/env node
/**
 * Static checks used by pre_commit_checks.sh
 *
 * Checks performed:
 *  - Reject changes to template/webpack.config.js
 *  - Reject changes to template/package.json that modify webpack-related dependencies
 *  - Ensure files that render data cells reference DrillableCell (heuristic)
 *  - Ensure visual components reference onRenderComplete or done (heuristic)
 *
 * This is intentionally heuristic-based to be fast and avoid full AST parsing.
 * It exits with a non-zero code on failure.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function run(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8" }).trim();
  } catch (e) {
    return "";
  }
}

function getChangedFilesFromArgsOrGit() {
  const args = process.argv.slice(2);
  const filesArgIndex = args.indexOf("--files");
  if (filesArgIndex !== -1 && args[filesArgIndex + 1]) {
    return args[filesArgIndex + 1]
      .split(/\r?\n/)
      .map((f) => f.trim())
      .filter(Boolean);
  }

  // If not provided, attempt to get staged files. If none, return empty to signal full-scan mode.
  const staged = run("git diff --name-only --cached");
  if (staged) {
    return staged.split(/\r?\n/).map((f) => f.trim()).filter(Boolean);
  }

  // No staged files, return empty -> caller should treat as full-scan
  return [];
}

function loadJsonAtRef(ref, filePath) {
  try {
    const out = run(`git show ${ref}:${filePath}`);
    return JSON.parse(out);
  } catch (e) {
    return null;
  }
}

function loadFileAtRef(ref, filePath) {
  try {
    return run(`git show ${ref}:${filePath}`);
  } catch (e) {
    return null;
  }
}

function walkFiles(root, exts = [".tsx", ".ts", ".jsx", ".js"]) {
  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(p);
      } else {
        if (exts.includes(path.extname(entry.name))) files.push(p);
      }
    }
  }
  if (fs.existsSync(root)) walk(root);
  return files;
}

function readFileSafe(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

function checkWebpackConfigChange(changedFiles) {
  const target = "template/webpack.config.js";
  if (changedFiles.length === 0) return; // full-scan mode: do not fail on change detection here

  if (changedFiles.includes(target)) {
    console.error(`ERROR: Changes to ${target} are not allowed by policy.`);
    process.exitCode = 1;
  }
}

function checkPackageJsonWebpackChanges(changedFiles) {
  const target = "template/package.json";
  if (changedFiles.length === 0) return;

  if (!changedFiles.includes(target)) return;

  // Compare HEAD (or main) and staged content
  const headJson = loadJsonAtRef("HEAD", target) || {};
  const stagedJson = loadJsonAtRef("", target); // empty ref attempt: fallback to current fs
  let staged;
  try {
    staged = JSON.parse(fs.readFileSync(target, "utf8"));
  } catch {
    staged = stagedJson || {};
  }

  const depsKeys = (obj = {}) =>
    Object.keys(obj.dependencies || {}).concat(Object.keys(obj.devDependencies || {}));

  const headDeps = depsKeys(headJson);
  const stagedDeps = depsKeys(staged);

  const allKeys = Array.from(new Set([...headDeps, ...stagedDeps]));
  const webpackRelated = allKeys.filter((k) => /webpack|webpack-cli|webpack-dev-server|@webpack-cli|webpack-/.test(k));

  if (webpackRelated.length > 0) {
    // For each webpack-related package, compare versions
    const changed = webpackRelated.filter((pkg) => {
      const headV =
        (headJson.dependencies && headJson.dependencies[pkg]) ||
        (headJson.devDependencies && headJson.devDependencies[pkg]) ||
        null;
      const stagedV =
        (staged.dependencies && staged.dependencies[pkg]) || (staged.devDependencies && staged.devDependencies[pkg]) || null;
      return headV !== stagedV;
    });
    if (changed.length > 0) {
      console.error(
        `ERROR: Changes to webpack-related dependencies in ${target} are not allowed in automated changes. Changed packages: ${changed.join(
          ", "
        )}`
      );
      process.exitCode = 1;
    }
  }
}

function checkDrillableUsage(changedFiles) {
  // Heuristic: any file that contains "cell." or "rendered" or "row[" and is rendering JSX should import/use DrillableCell.
  // We'll scan template/src and any files changed (or full scan if changedFiles empty).
  const rootsToScan = [];

  if (changedFiles.length > 0) {
    // restrict to changed .tsx/.jsx files under template/src or packages or test_app src visualization areas
    changedFiles.forEach((f) => {
      if (/\.(tsx|jsx|ts)$/.test(f) && /template\/src|test_app\/src|packages\//.test(f)) {
        rootsToScan.push(f);
      }
    });
  } else {
    // full-scan mode
    rootsToScan.push(...walkFiles("template/src"));
    rootsToScan.push(...walkFiles("test_app/src"));
  }

  const violations = [];

  rootsToScan.forEach((filePath) => {
    let content;
    if (fs.existsSync(filePath)) {
      content = readFileSafe(filePath);
    } else {
      // attempt to read staged content if available
      content = loadFileAtRef("", filePath) || "";
    }
    const hasCellAccess = /\bcell\.|\brendered\b|\brow\[[^\]]+\]/.test(content);
    const usesDrillable = /\bDrillableCell\b/.test(content);
    const containsJSX = /<[^>]+>/.test(content);
    if (hasCellAccess && containsJSX && !usesDrillable) {
      violations.push(filePath);
    }
  });

  if (violations.length > 0) {
    console.error(
      "ERROR: The following files render data cells but do not reference DrillableCell (heuristic). Ensure DrillableCell is used for displayed data points:\n" +
        violations.map((v) => "  - " + v).join("\n")
    );
    process.exitCode = 1;
  }
}

function checkRenderCompleteUsage(changedFiles) {
  // Heuristic: any component under template/src that looks like a viz should reference onRenderComplete or done
  const roots = [];
  if (changedFiles.length > 0) {
    changedFiles.forEach((f) => {
      if (/\.(tsx|jsx|ts)$/.test(f) && /template\/src|test_app\/src|packages\//.test(f)) {
        roots.push(f);
      }
    });
  } else {
    roots.push(...walkFiles("template/src"));
  }

  const missing = [];
  roots.forEach((filePath) => {
    if (!fs.existsSync(filePath)) return;
    const content = readFileSafe(filePath);
    const looksLikeViz = /\bonRenderComplete\b|\bdone\(|\bVizProvider\b|\bLookerCustomViz\b/.test(content) === false && /\bdata\b/.test(content);
    // If file has data usage and does not reference any renderComplete pattern, flag it
    const referencesSignal = /\bonRenderComplete\b|\bdone\(|\bupdateAsync\b|\bonRenderComplete\?\(\)/.test(content);
    if (looksLikeViz && !referencesSignal) {
      // Only flag if file contains JSX markup
      if (/<[a-zA-Z]/.test(content)) {
        missing.push(filePath);
      }
    }
  });

  // This check is weaker; emit warnings rather than hard failing.
  if (missing.length > 0) {
    console.warn(
      "WARNING: The following files may render data but do not reference onRenderComplete/done heuristically. Make sure the viz calls onRenderComplete(done) when rendering is complete:\n" +
        missing.map((v) => "  - " + v).join("\n")
    );
  }
}

function main() {
  const changedFiles = getChangedFilesFromArgsOrGit();
  checkWebpackConfigChange(changedFiles);
  checkPackageJsonWebpackChanges(changedFiles);
  checkDrillableUsage(changedFiles);
  checkRenderCompleteUsage(changedFiles);

  if (process.exitCode && process.exitCode !== 0) {
    console.error("Static checks failed.");
    process.exit(process.exitCode);
  }

  console.log("Static checks passed.");
  process.exit(0);
}

main();