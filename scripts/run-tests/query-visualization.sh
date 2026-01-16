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
  CHATTY_TEST_FILE="test_app/src/__tests__/${PACKAGE_NAME}/chatty-visualization.test.ts"
  
  if [[ ! -f "$TEST_FILE" ]]; then
    echo "Error: Test file not found at $TEST_FILE"
    exit 1
  fi
  
  echo "Running tests for package: $PACKAGE_NAME"
  
  # Server Lifecycle Management
  PORT=4444
  SERVER_PID=""
  
  check_server() {
    curl -s "http://localhost:$PORT" > /dev/null
  }
  
  if ! check_server; then
     echo "Test server not running on port $PORT. Starting it..."
     # Start server in background
     cd test_app && yarn dev --port $PORT &
     SERVER_PID=$!
     cd ..
     
     echo "Waiting for server to be ready..."
     MAX_RETRIES=60
     count=0
     while ! check_server; do
       sleep 1
       count=$((count+1))
       if [ $count -ge $MAX_RETRIES ]; then
         echo "Error: Server failed to start within $MAX_RETRIES seconds."
         if [ -n "$SERVER_PID" ]; then kill "$SERVER_PID"; fi
         exit 1
       fi
     done
     echo "Server is ready."
  else
     echo "Test server already running on port $PORT."
  fi

  # Start Visualization Server
  echo "Starting visualization server for $PACKAGE_NAME..."
  cd "packages/$PACKAGE_NAME" && yarn start &
  VIZ_SERVER_PID=$!
  cd ../..

  echo "Waiting for visualization server to be ready..."
  # Wait for bundle.js to be available
  VIZ_PORT=8080
  VIZ_URL="https://localhost:$VIZ_PORT/bundle.js"
  
  check_viz_server() {
    curl -k -s -o /dev/null -w "%{http_code}" "$VIZ_URL" | grep -q "200"
  }

  MAX_RETRIES=60
  count=0
  while ! check_viz_server; do
    sleep 1
    count=$((count+1))
    if [ $count -ge $MAX_RETRIES ]; then
       echo "Error: Visualization server failed to start within $MAX_RETRIES seconds."
       if [ -n "$SERVER_PID" ]; then kill "$SERVER_PID"; fi
       if [ -n "$VIZ_SERVER_PID" ]; then kill "$VIZ_SERVER_PID"; fi
       exit 1
    fi
  done
  echo "Visualization server is ready at $VIZ_URL"

  # Run both existing and new chatty tests
  # Using 'yarn test' instead of 'yarn run test:all' as test:all does not exist
  # Pass VIZ_URL env var
  VIZ_URL="$VIZ_URL" yarn test -- "$TEST_FILE"
  EXIT_CODE_1=$?

  if [[ -f "$CHATTY_TEST_FILE" ]]; then
      echo "Running chatty visualization tests..."
      VIZ_URL="$VIZ_URL" yarn test -- "$CHATTY_TEST_FILE"
      EXIT_CODE_2=$?
  else
      echo "No chatty visualization test found for $PACKAGE_NAME. Skipping."
      EXIT_CODE_2=0
  fi
  
  if [ -n "$SERVER_PID" ]; then
    echo "Stopping test server (PID: $SERVER_PID)..."
    kill "$SERVER_PID"
  fi

  if [ -n "$VIZ_SERVER_PID" ]; then
    echo "Stopping visualization server (PID: $VIZ_SERVER_PID)..."
    kill "$VIZ_SERVER_PID"
  fi
  
  # Return matching exit code if any failed
  if [ $EXIT_CODE_1 -ne 0 ] || [ $EXIT_CODE_2 -ne 0 ]; then
      exit 1
  fi
  exit 0
else
  echo "Usage: $0 --all | -P <package_name>"
  exit 1
fi
