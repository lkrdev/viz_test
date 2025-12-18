#!/usr/bin/env bash
# Pre-commit / CI entrypoint for static checks
# Usage:
#  - Locally (pre-commit): staged files will be checked (default)
#  - Targeted package: ./scripts/pre_commit_checks.sh -P <package_name>
#  - In CI: export CI=true and the script will scan the repository for problems
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_SCRIPT="${SCRIPT_DIR}/static_checks.js"

FILES=""
PACKAGE_NAME=""

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        -P|--package) PACKAGE_NAME="$2"; shift ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

if [ -n "$PACKAGE_NAME" ]; then
  echo "Running static checks for package: $PACKAGE_NAME"
  PACKAGE_DIR="packages/$PACKAGE_NAME"
  
  if [ ! -d "$PACKAGE_DIR" ]; then
    echo "Error: Package directory '$PACKAGE_DIR' does not exist."
    exit 1
  fi

  # Find relevant files in the package directory, excluding node_modules and dist
  FILES="$(find "$PACKAGE_DIR" -name "node_modules" -prune -o -name "dist" -prune -o -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "package.json" -o -name "webpack.config.js" \) -print)"
  
elif [ -z "${CI:-}" ]; then
  echo "Running pre-commit style checks against staged files..."
  # Get staged filenames
  FILES="$(git diff --name-only --cached)"
else
  echo "Running CI-style checks against repository files..."
  # In CI, run a full scan
  FILES=""
fi

node "${NODE_SCRIPT}" ${FILES:+--files "$FILES"}