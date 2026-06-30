const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', exception => {
    errors.push(exception.message);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  await page.goto('http://localhost:5173/centros', { waitUntil: 'networkidle' });
  
  // Click first Quiero Donar button
  const donarBtn = await page.$('.btn-primary');
  if (donarBtn) {
    await donarBtn.click();
    await page.waitForTimeout(1000);
  } else {
    console.log("No donar button found");
  }

  console.log("Errors caught:", errors);
  await browser.close();
})();
