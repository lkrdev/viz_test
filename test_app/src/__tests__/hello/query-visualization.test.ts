/**
 * Visual regression test for QueryVisualization component
 */

import { toMatchImageSnapshot } from "jest-image-snapshot";
import stringify from "json-stable-stringify";
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
      acceptInsecureCerts: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--ignore-certificate-errors"
      ],
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  test.each(queries)(
    "should match snapshot for query %s",
    async (query) => {
      let { query_id, height = DEFAULT_HEIGHT, width = DEFAULT_WIDTH, vis_config_override } = query;
      height = safeHWParse(height, "height");
      width = safeHWParse(width, "width");

      const page = await browser.newPage();

      try {
        await page.setViewport({
          width,
          height,
          deviceScaleFactor: 1,
        });

        let url = new URL(`http://localhost:4444/query/${query_id}`);
        url.searchParams.set("height", height.toString());
        url.searchParams.set("width", width.toString());
        const id_arr: string[] = [query_id, String(height), String(width)]
        const use_vis_config = vis_config_override && Object.keys(vis_config_override).length > 0;
        if (use_vis_config) {
          url.searchParams.set("vis_config_override", JSON.stringify(vis_config_override));
          id_arr.push(stringify(vis_config_override) || "")
        }

        await page.goto(url.toString(), {
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
          customSnapshotIdentifier: id_arr.join("-"),
        });
      } finally {
        await page.close();
      }
    },
    60000
  );
});
