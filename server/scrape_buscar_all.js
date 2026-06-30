const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  
  let allData = [];
  
  page.on('request', req => {
    if (req.url().includes('api/data')) {
      console.log(`REQ: ${req.method()} ${req.url()} - Body: ${req.postData()}`);
    }
  });

  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('api/data')) {
      try {
        const text = await res.text();
        const json = JSON.parse(text);
        if (json.data && Array.isArray(json.data)) {
          allData = allData.concat(json.data);
          console.log(`Fetched ${json.data.length} items`);
        }
      } catch (e) {}
    }
  });

  console.log("Navigating to https://redayudavenezuela.com/buscar ...");
  await page.goto('https://redayudavenezuela.com/buscar', { waitUntil: 'networkidle0', timeout: 30000 });
  
  console.log("Typing 'a' ...");
  await page.waitForSelector('input');
  await page.type('input', 'a');
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Typing 'e' ...");
  await page.evaluate(() => document.querySelector('input').value = '');
  await page.type('input', 'e');
  await new Promise(r => setTimeout(r, 2000));
  
  fs.writeFileSync('redayuda_api_full.json', JSON.stringify(allData, null, 2), 'utf8');
  console.log(`Saved ${allData.length} items to redayuda_api_full.json`);
  
  await browser.close();
})();
