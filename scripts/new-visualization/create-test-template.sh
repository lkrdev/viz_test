#!/bin/bash

# create a test template for a new package which means creating a new folder, a new query-visualization.test.ts file a new queries.ts file and a new query-render.test.ts file

if [ -z "$1" ]; then
  echo "Usage: $0 <package_name>"
  exit 1
fi

if [ -d "$1" ]; then
  echo "Error: Folder '$1' already exists."
  exit 1
fi

PACKAGE_NAME=$1
TARGET_DIR="test_app/src/__tests__/$PACKAGE_NAME"

if [ -d "$TARGET_DIR" ]; then
  echo "Directory $TARGET_DIR already exists."
  exit 1
fi

mkdir -p "$TARGET_DIR"

# Create queries.ts
cat <<EOF > "$TARGET_DIR/queries.ts"
import { Query } from "../queries/types";

const queries: Query[] = [
  // {
  //   query_id: "example_id",
  //   height: 300,
  //   width: 400,
  // },
];

export default queries;
EOF

# Create query-visualization.test.ts
cat <<EOF > "$TARGET_DIR/query-visualization.test.ts"
/**
 * Visual regression test for QueryVisualization component
 */

import { toMatchImageSnapshot } from "jest-image-snapshot";
import puppeteer, { Browser } from "puppeteer";
import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from "../../app/constants";
import { safeHWParse } from "../../app/utils";
import queries from "./queries";

expect.extend({ toMatchImageSnapshot });

describe("QueryVisualization Visual Tests - $PACKAGE_NAME", () => {
  let browser: Browser;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  test.each(queries)(
    "should match snapshot for query %s",
    async (query) => {
      let { query_id, height = DEFAULT_HEIGHT, width = DEFAULT_WIDTH } = query;
      height = safeHWParse(height, "height");
      width = safeHWParse(width, "width");

      const page = await browser.newPage();

      try {
        await page.setViewport({
          width,
          height,
          deviceScaleFactor: 1,
        });

        await page.goto(
          \`http://localhost:4444/query/\${query_id}?height=\${height}&width=\${width}\`,
          {
            waitUntil: "networkidle0",
            timeout: 30000,
          }
        );

        await page.waitForSelector("#query-done", {
          timeout: 30000,
        });

        await new Promise((resolve) => setTimeout(resolve, 2000));

        const screenshot = await page.screenshot({
          fullPage: false,
        });

        expect(screenshot).toMatchImageSnapshot({
          failureThreshold: 0.01,
          failureThresholdType: "percent",
          customSnapshotIdentifier: \`\${query_id}-\${height}-\${width}\`,
        });
      } finally {
        await page.close();
      }
    },
    60000
  );
});
EOF

# Create chatty-visualization.test.ts
cat <<EOF > "$TARGET_DIR/chatty-visualization.test.ts"
/**
 * Visual regression test for Chatty Visualization component
 */

import { toMatchImageSnapshot } from "jest-image-snapshot";
import puppeteer, { Browser } from "puppeteer";
import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from "../../app/constants";
import { safeHWParse } from "../../app/utils";
import queries from "./queries";

expect.extend({ toMatchImageSnapshot });

describe("Chatty Visualization Visual Tests - $PACKAGE_NAME", () => {
  let browser: Browser;
  const visualizations = ["/test_viz.html"];

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  const testCases = visualizations.flatMap(viz => 
    queries.map(q => ({ viz, query: q }))
  );

  test.each(testCases)(
    "should match snapshot for viz %s and query %s",
    async ({ viz, query }) => {
      let { query_id, height = DEFAULT_HEIGHT, width = DEFAULT_WIDTH } = query;
      height = safeHWParse(height, "height");
      width = safeHWParse(width, "width");

      const page = await browser.newPage();

      try {
        await page.setViewport({
          width,
          height,
          deviceScaleFactor: 1,
        });

        const encodedViz = encodeURIComponent(viz);
        const url = \`http://localhost:4444/chatty/\${query_id}?viz_url=\${encodedViz}&height=\${height}&width=\${width}\`;
        
        await page.goto(url, {
            waitUntil: "networkidle0",
            timeout: 30000,
          }
        );

        await page.waitForFunction(
          () => document.body.innerText.includes("Status: connected"),
          { timeout: 30000 }
        );

        await page.waitForSelector('button:not([disabled])', { timeout: 30000 });

        await new Promise((resolve) => setTimeout(resolve, 2000));

        const screenshot = await page.screenshot({
          fullPage: false,
        });

        expect(screenshot).toMatchImageSnapshot({
          failureThreshold: 0.01,
          failureThresholdType: "percent",
          customSnapshotIdentifier: \`chatty-\${query_id}-\${height}-\${width}\`,
        });

      } finally {
        await page.close();
      }
    },
    60000
  );
});
EOF

echo "Test template created for package '$PACKAGE_NAME' in '$TARGET_DIR'."



# Create query-render.test.ts
cat <<EOF > "$TARGET_DIR/query-render.test.ts"
import { Query } from "../../../types";

describe("Query Render Tests - $PACKAGE_NAME", () => {
  test("should have queries defined", () => {
    expect(queries).toBeDefined();
    expect(Array.isArray(queries)).toBe(true);
  });
});
EOF

echo "Created test template for $PACKAGE_NAME in $TARGET_DIR"
