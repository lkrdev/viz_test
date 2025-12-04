#!/bin/bash

# Get the directory of the script
SCRIPT_DIR=$(dirname "$0")
# Get the root directory of the project
PROJECT_ROOT=$(cd "$SCRIPT_DIR/../" && pwd)

ENV_EXAMPLE_FILE="$PROJECT_ROOT/.env.example"
TEST_APP_ENV_FILE="$PROJECT_ROOT/test_app/.env"

# Load test_app/.env if it exists
if [ -f "$TEST_APP_ENV_FILE" ]; then
  echo "Loading environment variables from $TEST_APP_ENV_FILE"
  export $(grep -v '^#' "$TEST_APP_ENV_FILE" | xargs)
fi

# Check for missing environment variables based on .env.example
MISSING_VARS=()
while IFS= read -r line || [ -n "$line" ]; do
  # Skip empty lines and comments
  if [[ -z "$line" ]] || [[ "$line" == \#* ]]; then
    continue
  fi

  VAR_NAME=$(echo "$line" | cut -d '=' -f 1)
  if [ -z "${!VAR_NAME}" ]; then
    MISSING_VARS+=("$VAR_NAME")
  fi
done < "$ENV_EXAMPLE_FILE"

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
  echo "Error: Missing the following environment variables:"
  for var in "${MISSING_VARS[@]}"; do
    echo "  - $var"
  done
  echo "Please define them in $TEST_APP_ENV_FILE or in your environment."
  exit 1
else
  echo "All required environment variables are set."
fi
