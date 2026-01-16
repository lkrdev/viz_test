/**
 * Visual regression test for QueryVisualization component
 */

import { toMatchImageSnapshot } from "jest-image-snapshot";
import puppeteer, { Browser } from "puppeteer";
import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from "../../app/constants";
import { safeHWParse } from "../../app/utils";
import queries from "./queries";

expect.extend({ toMatchImageSnapshot });

describe("QueryVisualization Visual Tests - hello", () => {
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

        const errors: string[] = [];
        page.on("console", (msg: any) => {
          if (msg.type() === "error") {
            errors.push(msg.text());
          }
        });
        page.on("pageerror", (err: any) => {
          errors.push(err.toString());
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

        // Check for console errors
        if (errors.length > 0) {
          // Filter out known/ignorable errors if necessary
          // For now, fail on any error
          throw new Error(`Console errors detected:\n${errors.join("\n")}`);
        }

        // Verify events were captured (Basic check for now)
        const events = await page.evaluate(() => {
          return window.__LOOKER_EMBED_EVENTS__ || [];
        });
        // We expect at least the explore:run:complete event
        const hasRunComplete = events.some((e: any) => e.type === "explore:run:complete");
        if (!hasRunComplete) {
          console.warn("Warning: explore:run:complete event not detected in window.__LOOKER_EMBED_EVENTS__");
        }

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
});
