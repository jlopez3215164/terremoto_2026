const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.launch({ headless: true });
    console.log("Playwright is working!");
    await browser.close();
  } catch (e) {
    console.log("Playwright error:", e.message);
  }
})();
