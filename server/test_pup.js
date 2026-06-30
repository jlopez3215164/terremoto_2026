const puppeteer = require('puppeteer');
(async () => {
  try {
    const browser = await puppeteer.launch({
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: 'new'
    });
    const page = await browser.newPage();
    await page.goto('https://busquedavzla.netlify.app', { waitUntil: 'networkidle0' });
    const text = await page.evaluate(() => document.body.innerText);
    console.log(text.slice(0, 1500));
    await browser.close();
  } catch(e) {
    console.log("Error:", e.message);
  }
})();
