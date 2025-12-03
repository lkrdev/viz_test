# Jest Image Snapshot Testing Setup

This project is configured with `ts-jest` and `jest-image-snapshot` for visual regression testing.

## Installed Packages

- **ts-jest**: TypeScript preprocessor for Jest
- **jest-image-snapshot**: Jest matcher for image comparisons
- **@types/jest-image-snapshot**: TypeScript definitions

## Available Scripts

```bash
# Run all tests
yarn test

# Run tests in watch mode (re-runs on file changes)
yarn test:watch

# Update all snapshots
yarn test:update-snapshots
```

## Configuration Files

- **jest.config.js**: Main Jest configuration
- **jest.setup.ts**: Setup file that extends Jest with image snapshot matchers
- **jest-image-snapshot.d.ts**: TypeScript declarations for the custom matcher

## How to Use Image Snapshots

### Basic Usage

```typescript
import { toMatchImageSnapshot } from "jest-image-snapshot";

expect.extend({ toMatchImageSnapshot });

it("should match image snapshot", () => {
  const imageBuffer = expect(imageBuffer).toMatchImageSnapshot(); // ... get your image buffer (e.g., from a screenshot)
});
```

### With Options

```typescript
expect(imageBuffer).toMatchImageSnapshot({
  failureThreshold: 0.01, // Allow 1% difference
  failureThresholdType: "percent", // 'percent' or 'pixel'
  customSnapshotIdentifier: "my-test", // Custom name for snapshot
  customSnapshotsDir: "__image_snapshots__",
  customDiffDir: "__image_snapshots__/__diff_output__",
});
```

## Common Options

- **failureThreshold**: Number between 0 and 1 for percentage, or number of pixels
- **failureThresholdType**: `'percent'` or `'pixel'`
- **customSnapshotIdentifier**: Custom name for the snapshot file
- **customSnapshotsDir**: Directory to store snapshots (default: `__image_snapshots__`)
- **customDiffDir**: Directory to store diff images when tests fail
- **updatePassedSnapshot**: Update snapshot even if test passes

## Integration with Browser Testing

For actual visual regression testing, you'll typically use this with a headless browser:

### With Puppeteer

```bash
yarn add -D puppeteer
```

```typescript
import puppeteer from "puppeteer";

describe("Visual Regression Tests", () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  it("should match homepage screenshot", async () => {
    await page.goto("http://localhost:3000");
    await page.setViewport({ width: 1920, height: 1080 });
    const screenshot = await page.screenshot();
    expect(screenshot).toMatchImageSnapshot();
  });
});
```

### With Playwright

```bash
yarn add -D @playwright/test
```

```typescript
import { chromium } from "playwright";

describe("Visual Regression Tests", () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  it("should match homepage screenshot", async () => {
    await page.goto("http://localhost:3000");
    await page.setViewportSize({ width: 1920, height: 1080 });
    const screenshot = await page.screenshot();
    expect(screenshot).toMatchImageSnapshot();
  });
});
```

## Snapshot Management

### First Run

On the first run, snapshots will be created and saved in the `__image_snapshots__` directory.

### Subsequent Runs

Tests will compare against the saved snapshots and fail if differences exceed the threshold.

### Updating Snapshots

When you intentionally change the UI, update snapshots with:

```bash
yarn test:update-snapshots
```

Or update a specific test:

```bash
yarn test -u path/to/test.test.ts
```

## Troubleshooting

### TypeScript Errors

If you see TypeScript errors about the `toMatchImageSnapshot` matcher, make sure:

1. The `jest-image-snapshot.d.ts` file is in your project root
2. Your `tsconfig.json` includes this file

### Snapshots Not Updating

Make sure you're running with the `-u` or `--updateSnapshot` flag:

```bash
yarn test:update-snapshots
```

### Diff Images

When tests fail, diff images are saved to help you see what changed. Look for:

- `__image_snapshots__/__diff_output__/` directory
- Files with `-diff.png` suffix

## Example Test

See `src/__tests__/example-image-snapshot.test.ts` for a working example.
