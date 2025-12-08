#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Error: No template name provided."
  echo "Usage: $0 <template-name>"
  exit 1
fi

PACKAGE_NAME=$1
TEMPLATE_DIR="template"
TARGET_DIR="packages/$PACKAGE_NAME"
ROOT_DIR=$(pwd)

# Ensure we are in the root directory (heuristic: check for package.json)
if [ ! -f "package.json" ]; then
    echo "Error: Please run this script from the project root."
    exit 1
fi

if [ -d "$TARGET_DIR" ]; then
  echo "Error: Folder '$TARGET_DIR' already exists."
  exit 1
fi

echo "Creating package '$PACKAGE_NAME' from template..."

# 1. Copy the template directory to the new package directory
cp -r "$TEMPLATE_DIR" "$TARGET_DIR"

# 2. Update the package.json name
# We use a temporary file to ensure cross-platform compatibility (Linux/macOS sed differences)
# or just simple sed for Linux/Bash environment.
SED_CMD="s/\"name\": \"marketplace-viz-tsx-skeleton\"/\"name\": \"$PACKAGE_NAME\"/"

if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS requires an extension argument for -i
  sed -i '' "$SED_CMD" "$TARGET_DIR/package.json"
else
  # Linux (GNU sed)
  sed -i "$SED_CMD" "$TARGET_DIR/package.json"
fi

# 3. Clean up any template-specific artifacts if necessary (e.g., node_modules if they were copied)
rm -rf "$TARGET_DIR/node_modules"
rm -rf "$TARGET_DIR/dist"
rm -f "$TARGET_DIR/package-lock.json"

echo "Successfully created package '$PACKAGE_NAME' in '$TARGET_DIR'."
echo "To get started:"
echo "  1. cd $TARGET_DIR"
echo "  2. npm install (or yarn install)"
echo "  3. npm start"
