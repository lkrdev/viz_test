/**
 * Visual regression test for QueryVisualization component
 */

import { toMatchImageSnapshot } from "jest-image-snapshot";
import puppeteer, { Browser } from "puppeteer";
import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from "../../app/constants";
import { safeHWParse } from "../../app/utils";
import queries from "../../mocks/multi_sparkline/queries";

expect.extend({ toMatchImageSnapshot });

describe("QueryVisualization Visual Tests - multi_sparkline", () => {
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

  if (queries.length > 0) {
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
            `http://localhost:4444/query/${query_id}?height=${height}&width=${width}`,
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
            customSnapshotIdentifier: `${query_id}-${height}-${width}`,
          });
        } finally {
          await page.close();
        }
      },
      60000
    );
  } else {
     test("skipping visual tests as no queries provided", () => {
         console.warn("No queries provided for multi_sparkline visual tests");
     });
  }
});
