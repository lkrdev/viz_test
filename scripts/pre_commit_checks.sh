#!/usr/bin/env bash
# Pre-commit / CI entrypoint for static checks
# Usage:
#  - Locally (pre-commit): staged files will be checked
#  - In CI: export CI=true and the script will scan the repository for problems
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_SCRIPT="${SCRIPT_DIR}/static_checks.js"

if [ -z "${CI:-}" ]; then
  echo "Running pre-commit style checks against staged files..."
  # Get staged filenames
  FILES="$(git diff --name-only --cached)"
else
  echo "Running CI-style checks against repository files..."
  # In CI, run a full scan
  FILES=""
fi

node "${NODE_SCRIPT}" ${FILES:+--files "$FILES"}