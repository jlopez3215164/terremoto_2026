const puppeteer = require('puppeteer');

(async () => {
  let browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  const apis = [];
  
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('api') || url.includes('json') || url.includes('graphql') || url.includes('trpc') || url.includes('supabase') || url.includes('firebase')) {
      apis.push(url);
    }
  });

  console.log("Navigating to https://redayudavenezuela.com/desaparecidos");
  await page.goto('https://redayudavenezuela.com/desaparecidos', { waitUntil: 'networkidle0', timeout: 15000 });
  
  console.log("Captured possible API endpoints:");
  console.log([...new Set(apis)]);
  
  await browser.close();
})();
