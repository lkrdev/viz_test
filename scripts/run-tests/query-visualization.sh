#!/bin/bash

# Usage:
#   ./scripts/run-tests/query-visualization.sh --all
#   ./scripts/run-tests/query-visualization.sh -P <package_name>

if [[ "$1" == "--all" ]]; then
  echo "Running all tests..."
  yarn run test:all
elif [[ "$1" == "-P" ]]; then
  if [[ -z "$2" ]]; then
    echo "Error: Package name required with -P"
    echo "Usage: $0 -P <package_name>"
    exit 1
  fi
  PACKAGE_NAME="$2"
  # Construct the expected test file path
  # Based on existing structure: test_app/src/__tests__/<package>/query-visualization.test.ts
  TEST_FILE="test_app/src/__tests__/${PACKAGE_NAME}/query-visualization.test.ts"
  
  if [[ ! -f "$TEST_FILE" ]]; then
    echo "Error: Test file not found at $TEST_FILE"
    exit 1
  fi
  
  echo "Running tests for package: $PACKAGE_NAME"
  # Pass the specific file to the test runner
  yarn run test:all -- "$TEST_FILE"
else
  echo "Usage: $0 --all | -P <package_name>"
  exit 1
fi
