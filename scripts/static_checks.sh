#!/bin/bash
# Static checks script
# Usage: ./static_checks.sh [--files "file1 file2..."]
# If --files is not provided, does a full scan (or heuristic based on git if implemented differently, but here we follow the JS logic: explicit files or fallback)
# But wait, logic in JS was: args -> staged -> empty/full.
# This script is called by pre_commit_checks.sh which passes explicit files.

set -euo pipefail

# Helper to check if array contains element
has_element() {
  local e match="$1"
  shift
  for e; do [[ "$e" == "$match" ]] && return 0; done
  return 1
}

FILES=()
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --files) 
           # Handle newlines if passed as single string
           IFS=$'\n' read -rd '' -a FILES <<<"$2" || true
           shift ;;
        *) ;;
    esac
    shift
done

# If no files passed via args, check staged. If no staged, empty (full scan handled by caller logic? JS script did git diff cached itself if no args).
# But pre_commit_checks.sh passes --files "$FILES". If FILES is empty, it passes nothing.
# JS script: "If not provided, attempt to get staged files. If none, return empty to signal full-scan mode"
# We should replicate that.
if [ ${#FILES[@]} -eq 0 ]; then
   # Try git diff --cached
   GIT_FILES="$(git diff --name-only --cached || true)"
   if [ -n "$GIT_FILES" ]; then
      IFS=$'\n' read -rd '' -a FILES <<<"$GIT_FILES" || true
   fi
fi

# If STILL empty, full scan mode?
# JS script: "No staged files, return empty -> caller should treat as full-scan"
# checkDrillableUsage logic: if changedFiles.length > 0 scan them, else full scan.
IS_FULL_SCAN=0
if [ ${#FILES[@]} -eq 0 ]; then
  IS_FULL_SCAN=1
fi

FAILURES=0

error() {
  echo "ERROR: $1" >&2
  FAILURES=1
}

warn() {
  echo "WARNING: $1" >&2
}

# 1. Check template/webpack.config.js changes
# Only if not full scan (JS: "if changedFiles.length === 0 return")
if [ $IS_FULL_SCAN -eq 0 ]; then
  for f in "${FILES[@]}"; do
    if [[ "$f" == "template/webpack.config.js" ]]; then
       error "Changes to template/webpack.config.js are not allowed by policy."
    fi
  done
fi

# 2. Check template/package.json webpack dependencies
if [ $IS_FULL_SCAN -eq 0 ]; then
  for f in "${FILES[@]}"; do
    if [[ "$f" == "template/package.json" ]]; then
       # Check for webpack-related changes in the diff
       # -U0 for zero context
       if git diff --cached -U0 -- template/package.json | grep -E '^[+-].*webpack'; then
         error "Changes to webpack-related dependencies in template/package.json are not allowed in automated changes."
       fi
    fi
  done
fi

# 3. Check Drillable Usage
# Heuristic: .tsx/.jsx files in template/src or test_app/src (or packages/) that use cell./rendered/row[] but no DrillableCell
FILES_TO_SCAN=()
if [ $IS_FULL_SCAN -eq 1 ]; then
  # Find all relevant files
  # JS: walkFiles("template/src"), walkFiles("test_app/src")
  while IFS= read -r line; do FILES_TO_SCAN+=("$line"); done < <(find template/src test_app/src -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" \))
else
  # Filter changed files
  for f in "${FILES[@]}"; do
     if [[ "$f" =~ \.(tsx|jsx|ts)$ ]] && [[ "$f" =~ (template/src|test_app/src|packages/) ]]; then
        FILES_TO_SCAN+=("$f")
     fi
  done
fi

VIOLATIONS=()
for f in "${FILES_TO_SCAN[@]}"; do
  if [ ! -f "$f" ]; then continue; fi
  CONTENT=$(cat "$f")
  
  # Bash regex matching - robust enough?
  # hasDataRef logic
  if echo "$CONTENT" | grep -qE "cell\.|rendered|row\["; then
     # hasJSX logic (simple check for <Tag)
     if echo "$CONTENT" | grep -qE "<[a-zA-Z]"; then
        # Check DrillableCell
        if ! echo "$CONTENT" | grep -q "DrillableCell"; then
           VIOLATIONS+=("$f")
        fi
     fi
  fi
done

if [ ${#VIOLATIONS[@]} -gt 0 ]; then
   error "The following files render data cells but do not reference DrillableCell (heuristic). Ensure DrillableCell is used for displayed data points:"
   for v in "${VIOLATIONS[@]}"; do
      echo "  - $v" >&2
   done
fi

# 4. Check Render Complete Usage
# Heuristic: viz components should reference onRenderComplete or done
MISSING_SIGNAL=()
FILES_TO_SCAN_RENDER=()

if [ $IS_FULL_SCAN -eq 1 ]; then
   while IFS= read -r line; do FILES_TO_SCAN_RENDER+=("$line"); done < <(find template/src -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" \))
else
   # Same filter as Drillable? JS says: "template/src | test_app/src | packages/" for Drillable but for RenderComplete:
   # JS: "if changedFiles... regex for template/src|test_app/src|packages/" -> same.
   for f in "${FILES[@]}"; do
     if [[ "$f" =~ \.(tsx|jsx|ts)$ ]] && [[ "$f" =~ (template/src|test_app/src|packages/) ]]; then
        FILES_TO_SCAN_RENDER+=("$f")
     fi
   done
fi

for f in "${FILES_TO_SCAN_RENDER[@]}"; do
   if [ ! -f "$f" ]; then continue; fi
   CONTENT=$(cat "$f")
   
   # looksLikeViz: does NOT reference VizProvider/LookerCustomViz AND has "data"
   # referencesSignal: onRenderComplete | done( | updateAsync | ...
   
   has_provider=$(echo "$CONTENT" | grep -E "VizProvider|LookerCustomViz" || true)
   has_data=$(echo "$CONTENT" | grep "data" || true)
   has_signal=$(echo "$CONTENT" | grep -E "onRenderComplete|done\(|updateAsync" || true)
   has_jsx=$(echo "$CONTENT" | grep -E "<[a-zA-Z]" || true)
   
   if [ -z "$has_provider" ] && [ -n "$has_data" ]; then
      if [ -z "$has_signal" ]; then
         if [ -n "$has_jsx" ]; then
            MISSING_SIGNAL+=("$f")
         fi
      fi
   fi
done

if [ ${#MISSING_SIGNAL[@]} -gt 0 ]; then
   warn "The following files may render data but do not reference onRenderComplete/done heuristically. Make sure the viz calls onRenderComplete(done) when rendering is complete:"
   for v in "${MISSING_SIGNAL[@]}"; do
      echo "  - $v" >&2
   done
fi

if [ $FAILURES -ne 0 ]; then
   echo "Static checks failed."
   exit 1
fi

echo "Static checks passed."
exit 0
