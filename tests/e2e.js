'use strict';

/**
 * E2E test: load the built Chrome extension in a real Chromium browser,
 * navigate to a GitHub releases page, and assert that the extension injects
 * download-count badges (.githubdownloadscounter) into the page.
 *
 * Outputs to $GITHUB_OUTPUT (if set):
 *   counter_count  – number of badges found
 *
 * Exits with code 1 on failure (a debug screenshot is still attempted).
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const EXTENSION_PATH = path.resolve('./dist/chrome');
const SCREENSHOT_PATH = path.resolve('./screenshot.png');
const TEST_URL = 'https://github.com/huggle/huggle3-qt-lx/releases/tag/3.4.13';
const COUNTER_SELECTOR = '.githubdownloadscounter';
const COUNTER_TIMEOUT_MS = 30_000;
const NAV_TIMEOUT_MS = 60_000;

(async () => {
  let context;
  try {
    console.log(`Loading extension from: ${EXTENSION_PATH}`);

    context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        '--no-sandbox',
        '--disable-dev-shm-usage',
      ],
    });

    const page = await context.newPage();

    // Inject the GitHub token (if available) into API requests made by the
    // extension so the test is not subject to unauthenticated rate limits.
    if (process.env.GITHUB_TOKEN) {
      await page.route('https://api.github.com/**', async (route) => {
        const headers = {
          ...route.request().headers(),
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        };
        await route.continue({ headers });
      });
    }

    console.log(`Navigating to: ${TEST_URL}`);
    await page.goto(TEST_URL, { timeout: NAV_TIMEOUT_MS });

    console.log('Waiting for the extension to inject download counters…');
    await page.waitForSelector(COUNTER_SELECTOR, { timeout: COUNTER_TIMEOUT_MS });

    const counters = await page.$$eval(COUNTER_SELECTOR, (els) =>
      els.map((el) => el.textContent.trim()),
    );

    console.log(`✅ Found ${counters.length} download counter(s): ${counters.join(', ')}`);

    await page.screenshot({ path: SCREENSHOT_PATH });
    console.log(`📸 Screenshot saved to ${SCREENSHOT_PATH}`);

    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `counter_count=${counters.length}\n`);
    }
  } catch (err) {
    console.error('❌ E2E test failed:', err.message);

    // Capture a debug screenshot so failures are easier to diagnose.
    if (context) {
      try {
        const pages = context.pages();
        if (pages.length > 0) {
          await pages[0].screenshot({ path: SCREENSHOT_PATH });
          console.log('📸 Debug screenshot saved.');
        }
      } catch (_) {
        // Ignore screenshot errors during failure handling.
      }
    }

    process.exit(1);
  } finally {
    if (context) {
      await context.close();
    }
  }
})();
