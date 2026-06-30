const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  const apis = [];
  
  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('api') || url.includes('supabase')) {
      try {
        const json = await res.json();
        console.log(`\nAPI: ${url}`);
        if (Array.isArray(json)) {
          console.log(`  Array with ${json.length} items`);
          if (json.length > 0) console.log('  Sample:', JSON.stringify(json[0]).slice(0, 300));
        } else if (json.data) {
          console.log(`  Object with data (${json.data.length} items)`);
        } else {
          console.log('  Keys:', Object.keys(json));
        }
      } catch(e) {}
    }
  });

  console.log("Navigating to https://redayudavenezuela.com/comunidad");
  await page.goto('https://redayudavenezuela.com/comunidad', { waitUntil: 'networkidle0', timeout: 30000 });
  
  const text = await page.evaluate(() => document.body.innerText);
  console.log("\n--- Page text (first 2000 chars) ---");
  console.log(text.slice(0, 2000));
  
  await browser.close();
  process.exit(0);
})();
