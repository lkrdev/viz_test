#!/bin/bash
set -e

PACKAGE_NAME=$1

if [ -z "$PACKAGE_NAME" ]; then
  echo "Usage: yarn new <package_name>"
  exit 1
fi

echo "Creating test template for $PACKAGE_NAME..."
yarn new:package-test $PACKAGE_NAME

echo "Creating package template for $PACKAGE_NAME..."
yarn new:package $PACKAGE_NAME

echo "Done creating $PACKAGE_NAME"
