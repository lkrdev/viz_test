#!/bin/bash

# go through each package and build a set of npm packages that are used as dependencies

PACKAGES_DIR="$(dirname "$0")/../packages"

find "$PACKAGES_DIR" -maxdepth 2 -name "package.json" -print0 | node -e "
  const chunks = [];
  process.stdin.on('data', chunk => chunks.push(chunk));
  process.stdin.on('end', () => {
    const input = Buffer.concat(chunks).toString();
    const files = input.split('\0').filter(Boolean);
    const packages = new Set();
    files.forEach(file => {
      try {
        const pkg = require(file);
        if (pkg.dependencies) Object.keys(pkg.dependencies).forEach(p => packages.add(p));
        if (pkg.devDependencies) Object.keys(pkg.devDependencies).forEach(p => packages.add(p));
      } catch (e) {
        console.error('Error processing file:', file, e);
      }
    });
    packages.forEach(p => console.log(p));
  });
  process.stdin.on('error', err => {
    console.error('Stdin error:', err);
  });
" | sort -u
