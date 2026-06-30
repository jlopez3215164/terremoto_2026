const puppeteer = require('puppeteer');

(async () => {
  let browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('api/data')) {
      console.log(`API URL: ${url}`);
      try {
        const json = await response.json();
        console.log(`Total records: ${json.length || Object.keys(json).length}`);
        if (Array.isArray(json)) {
            console.log(JSON.stringify(json.slice(0, 2), null, 2));
        } else if (json.data && Array.isArray(json.data)) {
            console.log(JSON.stringify(json.data.slice(0, 2), null, 2));
        }
      } catch(e) {
        console.log("Could not parse JSON:", e.message);
      }
    }
  });

  console.log("Navigating to https://redayudavenezuela.com/desaparecidos");
  await page.goto('https://redayudavenezuela.com/desaparecidos', { waitUntil: 'networkidle0', timeout: 30000 });
  
  await browser.close();
})();
