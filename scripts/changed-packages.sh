#!/bin/bash

# This script identifies which packages in the 'packages/' directory have changed
# compared to the base branch of a Pull Request.
# It is designed to run in a GitHub Action or locally.

# Determine the base reference to compare against.
if [ -n "$GITHUB_BASE_REF" ]; then
  # In GitHub Actions PRs, this is the target branch (e.g., 'main')
  BASE_REF="origin/$GITHUB_BASE_REF"
elif [ -n "$BASE_REF" ]; then
  # Use provided environment variable if set
  BASE_REF="$BASE_REF"
else
  # Local development: Try to find the most sensible base branch
  # 1. Try to get the upstream branch if it exists
  UPSTREAM=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null)
  
  # 2. Check for 'main' or 'master'
  if git rev-parse --verify main >/dev/null 2>&1; then
    BASE_REF="main"
  elif git rev-parse --verify master >/dev/null 2>&1; then
    BASE_REF="master"
  elif [ -n "$UPSTREAM" ] && [ "$UPSTREAM" != "$(git rev-parse --abbrev-ref HEAD)" ]; then
    BASE_REF="$UPSTREAM"
  else
    # Last resort: just compare against the last commit
    BASE_REF="HEAD~1"
  fi
fi

# Ensure we are at the project root
cd "$(dirname "$0")/.."

# Check if the base reference exists in the local git history.
if ! git rev-parse --verify "$BASE_REF" >/dev/null 2>&1; then
  # If origin/BASE_REF doesn't exist, try just the branch name.
  # If that also fails, we may need to fetch or fallback.
  CLEAN_REF="${BASE_REF#origin/}"
  if git rev-parse --verify "$CLEAN_REF" >/dev/null 2>&1; then
    BASE_REF="$CLEAN_REF"
  else
    # Fallback: if we can't find the base, we compare against the previous commit.
    # This is better than failing, especially for local testing.
    echo "Warning: Could not find base reference $BASE_REF. Falling back to HEAD~1." >&2
    BASE_REF="HEAD~1"
  fi
fi

# Find the merge base (the commit where the current branch diverged from the base).
# This gives us everything that has changed in the current PR/branch.
MERGE_BASE=$(git merge-base "$BASE_REF" HEAD)

# Get the list of changed files between the merge base and the current HEAD.
CHANGED_FILES=$(git diff --name-only "$MERGE_BASE" HEAD)

# Filter for files inside the 'packages/' directory and extract the package name.
# We look for paths like 'packages/my-package/...' and extract 'my-package'.
# We also filter out any changes that are just in the 'packages/' root (like README.md).
CHANGED_PACKAGES=$(echo "$CHANGED_FILES" | grep '^packages/' | cut -d/ -f2 | sort -u)

# Print the list of changed packages.
if [ -n "$CHANGED_PACKAGES" ]; then
  for PKG in $CHANGED_PACKAGES; do
    # Check if it's a directory (to avoid issues if someone adds a file directly in packages/)
    if [ -d "packages/$PKG" ]; then
      echo "$PKG"
    fi
  done
fi