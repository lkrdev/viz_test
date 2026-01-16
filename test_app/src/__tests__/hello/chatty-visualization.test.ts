/**
 * Visual regression test for Chatty Visualization component
 */

import { toMatchImageSnapshot } from "jest-image-snapshot";
import puppeteer, { Browser } from "puppeteer";
import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from "../../app/constants";
import { safeHWParse } from "../../app/utils";
import queries from "./queries";

expect.extend({ toMatchImageSnapshot });

describe("Chatty Visualization Visual Tests - hello", () => {
  let browser: Browser;
  // Define available visualizations to test. 
  // In a real scenario, this might come from a config or directory scan.
  // For 'hello' package, we assume standard /test_viz.html is the target.
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

  // Cartesian product of visualizations and queries
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

        const errors: string[] = [];
        page.on("console", (msg: any) => {
          if (msg.type() === "error") {
            errors.push(msg.text());
          }
        });
        page.on("pageerror", (err: any) => {
          errors.push(err.toString());
        });

        // Navigate to the chatty route
        // Note: We need to encode the vizUrl if it contains special characters, 
        // but for simple paths it's often fine. safe to encode.
        const encodedViz = encodeURIComponent(viz);
        const url = `http://localhost:4444/chatty/${query_id}?viz_url=${encodedViz}&height=${height}&width=${width}`;
        
        await page.goto(url, {
            waitUntil: "networkidle0",
            timeout: 30000,
          }
        );

        // Wait for the "Status: connected" text or similar indicator
        // The page displays "Status: connected" when Chatty is ready.
        // We can search for the text or a specific element.
        // Based on page.tsx: <Text>Status: {clientStatus}</Text>
        await page.waitForFunction(
          () => document.body.innerText.includes("Status: connected"),
          { timeout: 30000 }
        );

        // Also wait for query data to be loaded? 
        // The page layout shows a spinner if loadingConfig is true.
        // There is no explicit #query-done selector in page.tsx unlike query-render.
        // We might want to add one to page.tsx for easier testing, 
        // or just wait for the spinner to disappear.
        // page.tsx has: {loadingConfig && <Spinner />}
        // So we wait for Spinner to NOT be present? 
        // Or wait for "Resend Data" button to be enabled?
        // Button: <Button ... disabled={!queryData || clientStatus !== 'connected'}>
        // So we can wait for the button to be enabled using a selector.
        
        // Wait for the button to be enabled
        await page.waitForSelector('button:not([disabled])', { timeout: 30000 });

        // Wait a bit for the iframe content to generate/render
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Screenshot
        const screenshot = await page.screenshot({
          fullPage: false,
        });

        expect(screenshot).toMatchImageSnapshot({
          failureThreshold: 0.01,
          failureThresholdType: "percent",
          // Unique identifier for the snapshot
          customSnapshotIdentifier: `chatty-${query_id}-${height}-${width}`,
        });

      } finally {
        await page.close();
      }
    },
    60000
  );
});
