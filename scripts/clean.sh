#!/bin/bash

# Navigate to the project root
cd "$(dirname "$0")/.."

echo "Removing node_modules from test_app..."
rm -rf test_app/node_modules

echo "Removing node_modules from packages..."
for pkg in packages/*; do
  if [ -d "$pkg" ]; then
    echo "Cleaning $pkg..."
    rm -rf "$pkg/node_modules"
  fi
done

echo "Re-initializing project..."
./scripts/init.sh

echo "Clean and initialization complete!"
