#!/bin/bash

if [ -z "$1" ]; then
  echo "Error: No template name provided."
  echo "Usage: $0 <template-name>"
  exit 1
fi

if [ -d "$1" ]; then
  echo "Error: Folder '$1' already exists."
  exit 1
fi

echo "TODO: implement create-template.sh"
echo "Creating template for $1"