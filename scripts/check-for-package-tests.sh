#!/bin/bash

# Define paths
PACKAGES_DIR="packages"
TESTS_DIR="test_app/src/__tests__"

# Check if directories exist
if [ ! -d "$PACKAGES_DIR" ]; then
  echo "Error: $PACKAGES_DIR directory not found."
  exit 1
fi

if [ ! -d "$TESTS_DIR" ]; then
  echo "Error: $TESTS_DIR directory not found."
  exit 1
fi

MISSING_TESTS=0

# Iterate through each folder in the packages directory
for package_path in "$PACKAGES_DIR"/*; do
  if [ -d "$package_path" ]; then
    package_name=$(basename "$package_path")
    
    # Define the expected test file path
    # Based on example: packages/hello >> test_app/src/__tests__/hello/query-visualization.test.ts
    PACKAGE_HAS_ALL_EXPECTED_TESTS=0 # Flag to track if the current package has all its expected tests
    EXPECTED_TEST_FILES=("query-visualization.test.ts" "query-render.test.ts" "queries.ts")

    for test_file_suffix in "${EXPECTED_TEST_FILES[@]}"; do
      expected_test_file="$TESTS_DIR/$package_name/$test_file_suffix"
      if [ ! -f "$expected_test_file" ]; then
        echo "❌ Missing test for package '$package_name': expected '$expected_test_file'"
        MISSING_TESTS=1
        PACKAGE_HAS_ALL_EXPECTED_TESTS=1 # Mark that this package is missing at least one test
        break # No need to check further files for this package
      fi
    done

    if [ "$PACKAGE_HAS_ALL_EXPECTED_TESTS" -eq 0 ]; then
      echo "✅ Found all expected tests for package '$package_name'"
    fi
  fi
done

if [ $MISSING_TESTS -eq 1 ]; then
  echo "Some packages are missing tests."
  exit 1
else
  echo "All packages have corresponding tests."
  exit 0
fi