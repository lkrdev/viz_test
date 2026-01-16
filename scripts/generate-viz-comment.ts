import { LookerNodeSDK } from "@looker/sdk-node";
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { getSlugWithVisOverrides } from '../test_app/src/app/api/utils/index';
import { DevVisualizationType, getVizId, getVizUrl, PATH_MAP } from '../test_app/src/app/api/utils/viz_utils';
dotenv.config({ path: path.join(process.cwd(), "test_app", ".env") });

async function run() {
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

if (!process.env.LOOKERSDK_CLIENT_ID || !process.env.LOOKERSDK_CLIENT_SECRET) {
  console.error('LOOKERSDK_CLIENT_ID or LOOKERSDK_CLIENT_SECRET is not set');
  process.exit(1);
}
const viz_id = getVizId(package_name, type, suffix);
  const full_viz_id = `${process.env.LOOKER_VIZ_PROJECT_NAME}::${viz_id}`;
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
  try {
    const { default: queries } = await import(pathToFileURL(queriesPath).href);
    const sdk = LookerNodeSDK.init40();
    const querySlugs = new Set<string>();
    const new_queries: any[] = []

    if (Array.isArray(queries)) {
      for (const q of queries) {
        if (q.query_id) {
          const newQuery = await getSlugWithVisOverrides(sdk, q.query_id, full_viz_id, q.vis_config_override);
          if (newQuery && newQuery.client_id) {
            if (!querySlugs.has(newQuery.client_id)) {
              querySlugs.add(newQuery.client_id);
              new_queries.push(newQuery);
            }
          }
        }
      }
    }

    new_queries.forEach(q => {
      const u = new URL(`${process.env.LOOKERSDK_BASE_URL}/explore/${q.model}/${q.view}`)
      u.searchParams.set('qid', q.client_id)
      u.searchParams.set('toggle', 'vis')
      exploreUrls.push(u.toString());
    });
  } catch (e) {
    console.error(`Error processing queries from ${queriesPath}:`, e);
  }
}

console.log('### 🛠️ Manifest Entry');
console.log('```lookml');
console.log(lookml);
console.log('```');

  if (exploreUrls.length > 0) {
    console.log('\n### 🔍 Test Explores');
    exploreUrls.forEach(url => console.log(`- [${url}](${url})`));
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
