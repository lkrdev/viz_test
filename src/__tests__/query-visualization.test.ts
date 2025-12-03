/**
 * Visual regression test for QueryVisualization component
 *
 * This test uses Puppeteer to render the query visualization page
 * and compares screenshots against baseline snapshots.
 */

import { toMatchImageSnapshot } from "jest-image-snapshot";
import puppeteer, { Browser } from "puppeteer";
import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from "../app/constants";
import { safeHWParse } from "../app/utils";
import queries from "./queries/index";
expect.extend({ toMatchImageSnapshot });

describe("QueryVisualization Visual Tests", () => {
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
        // Set viewport to match the query parameters
        await page.setViewport({
          width,
          height,
          deviceScaleFactor: 1,
        });

        // Navigate to the specific query route
        await page.goto(
          `http://localhost:4444/query/${query_id}?height=${height}&width=${width}`,
          {
            waitUntil: "networkidle0", // Wait until network is idle
            timeout: 30000, // 30 second timeout
          }
        );

        // Wait for the query to complete loading
        await page.waitForSelector("#query-done", {
          timeout: 30000, // 30 second timeout for query to complete
        });

        // Wait 2 seconds after the query is done to ensure full render
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Take a screenshot
        const screenshot = await page.screenshot({
          fullPage: false, // Only capture the viewport
        });

        // Compare against baseline snapshot
        expect(screenshot).toMatchImageSnapshot({
          failureThreshold: 0.01, // Allow 1% difference
          failureThresholdType: "percent",
          customSnapshotIdentifier: `${query_id}-${height}-${width}`,
        });
      } finally {
        await page.close();
      }
    },
    60000
  );
});
