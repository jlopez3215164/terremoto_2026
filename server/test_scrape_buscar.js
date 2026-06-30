const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  
  const fs = require('fs');
  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('api/data')) {
      try {
        const text = await res.text();
        fs.writeFileSync('redayuda_api_data.json', text, 'utf8');
        console.log(`\n\n--- SAVED INTERCEPTED DATA FROM: ${url} ---`);
      } catch (e) {}
    }
  });

  page.on('request', req => {
    if (req.url().includes('api/data')) {
      console.log(`\n\n--- REQUEST TO ${req.url()} ---`);
      console.log(`Method: ${req.method()}`);
      console.log(`Body: ${req.postData()}`);
    }
  });

  console.log("Navigating to https://redayudavenezuela.com/buscar ...");
  await page.goto('https://redayudavenezuela.com/buscar', { waitUntil: 'networkidle0', timeout: 30000 });
  
  console.log("Typing 'Maria' in the input box...");
  await page.waitForSelector('input');
  await page.type('input', 'Maria');
  
  console.log("Waiting for network responses...");
  await new Promise(r => setTimeout(r, 5000));
  
  await browser.close();
})();
