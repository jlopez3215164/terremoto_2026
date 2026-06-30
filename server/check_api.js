const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('api') || url.includes('.json') || response.request().resourceType() === 'fetch') {
      console.log(`API URL: ${url}`);
      try {
        const text = await response.text();
        if (text.length > 500) console.log(`Response length: ${text.length}`);
      } catch(e) {}
    }
  });

  console.log("Navigating...");
  await page.goto('https://redayudavenezuela.com/desaparecidos', { waitUntil: 'networkidle0', timeout: 30000 });
  await browser.close();
  process.exit(0);
})();
