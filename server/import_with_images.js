const puppeteer = require('puppeteer');
const pool = require('./db');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  let apiData = null;
  
  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('api/data') && !apiData) {
      try {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          apiData = json.data;
        }
      } catch(e) {}
    }
  });

  await page.goto('https://redayudavenezuela.com/comunidad', { waitUntil: 'networkidle0', timeout: 30000 });
  
  // Wait a bit for the API response to be captured
  await new Promise(r => setTimeout(r, 2000));
  
  if (!apiData) {
    console.log("No API data intercepted!");
    await browser.close();
    process.exit(1);
  }

  console.log(`Intercepted ${apiData.length} records from API`);
  console.log("Sample record keys:", Object.keys(apiData[0]));
  console.log("Sample record:", JSON.stringify(apiData[0], null, 2));
  
  await browser.close();
  process.exit(0);
})();
