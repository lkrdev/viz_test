#!/usr/bin/env npx -y tsx
import * as fs from 'fs';
import * as path from 'path';
import { DevVisualizationType, getVizId, getVizUrl, PATH_MAP } from '../test_app/src/app/api/utils/viz_utils';

let package_name = process.argv[2];
let type = (process.argv[3] || 'draft') as DevVisualizationType;
const suffix = process.argv[4];
const version = process.argv[5];

const validTypes = Object.keys(PATH_MAP);

if (!package_name) {
  console.error('Usage: npx tsx generate-viz-comment.ts <package_name> [type] [suffix] [version]');
  process.exit(1);
}

// Check for swapped arguments: if package_name is a valid type and type is not, they might be swapped
if (validTypes.includes(package_name) && !validTypes.includes(type)) {
  const temp = package_name;
  package_name = type;
  type = temp as DevVisualizationType;
}

// Ensure type is valid, fallback to draft
if (!validTypes.includes(type)) {
  type = 'draft';
}

if (!process.env.LOOKERSDK_BASE_URL) {
  console.error('LOOKERSDK_BASE_URL is not set');
  process.exit(1);
}

const viz_id = getVizId(package_name, type, suffix);
const viz_url = getVizUrl(type, package_name, suffix, version);

const lookml = `visualization: {
  id: "${viz_id}"
  label: "${package_name} (${type})"
  url: "${viz_url}"
}`;

// Try to extract query IDs from test_app/src/__tests__/[package_name]/queries.ts
let exploreUrls: string[] = [];
const queriesPath = path.join(process.cwd(), 'test_app/src/__tests__', package_name, 'queries.ts');

if (fs.existsSync(queriesPath)) {
  const content = fs.readFileSync(queriesPath, 'utf8');
  const lines = content.split('\n');
  const queryIdRegex = /query_id:\s*["']([^"']+)["']/;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//')) return;
    const match = trimmed.match(queryIdRegex);
    if (match) {
      exploreUrls.push(`${process.env.LOOKERSDK_BASE_URL}/x/${match[1]}`);
    }
  });
}

console.log('### 🛠️ Manifest Entry');
console.log('```lookml');
console.log(lookml);
console.log('```');

if (exploreUrls.length > 0) {
  console.log('\n### 🔍 Test Explores');
  exploreUrls.forEach(url => console.log(`- [${url}](${url})`));
}
