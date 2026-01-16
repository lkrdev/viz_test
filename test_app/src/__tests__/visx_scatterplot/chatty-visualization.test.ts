/**
 * Visual regression test for Chatty Visualization component
 */

import { toMatchImageSnapshot } from "jest-image-snapshot";
import puppeteer, { Browser } from "puppeteer";
import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from "../../app/constants";
import { safeHWParse } from "../../app/utils";
import queries from "./queries";

expect.extend({ toMatchImageSnapshot });

describe("Chatty Visualization Visual Tests - visx_scatterplot", () => {
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
        const url = `http://localhost:4444/chatty/${query_id}?viz_url=${encodedViz}&height=${height}&width=${width}`;

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
          customSnapshotIdentifier: `chatty-${query_id}-${height}-${width}`,
        });

      } finally {
        await page.close();
      }
    },
    60000
  );
});
