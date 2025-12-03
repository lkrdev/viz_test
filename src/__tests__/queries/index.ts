import fs from "fs";
import path from "path";
import { Query } from "./types";

const queries: Query[] = [];
const queriesDir = __dirname;

fs.readdirSync(queriesDir).forEach((file) => {
  // Skip index.ts, definition files, and non-ts files
  if (file === "index.ts" || file.endsWith(".d.ts") || !file.endsWith(".ts")) {
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const module = require(path.join(queriesDir, file));

  // Handle both ES modules (default export) and CommonJS
  const fileQueries = module.default || module;

  if (Array.isArray(fileQueries)) {
    queries.push(...fileQueries);
  }
});

export default queries;
