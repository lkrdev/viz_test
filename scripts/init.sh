#!/bin/bash

# Navigate to the project root
cd "$(dirname "$0")/.."

echo "Running yarn install in test_app..."
(cd test_app && yarn install)

echo "Running yarn install in packages concurrently..."
pids=""
for pkg in packages/*; do
  if [ -d "$pkg" ]; then
    echo "Installing dependencies in $pkg..."
    (cd "$pkg" && yarn install) &
    pids="$pids $!"
  fi
done

# Wait for all background processes to complete
for pid in $pids; do
  wait "$pid"
done

echo "All installations complete!"