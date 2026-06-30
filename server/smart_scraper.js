const puppeteer = require('puppeteer');

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    console.log("Navigating to https://redayudavenezuela.com");
    await page.goto('https://redayudavenezuela.com', { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Get all links
    const links = await page.$$eval('a', anchors => anchors.map(a => ({ text: a.innerText, href: a.href })));
    console.log("Links found on homepage:");
    console.log(links);
    
    // Look for a link related to missing persons
    const targetLink = links.find(l => 
      l.text.toLowerCase().includes('desaparecido') || 
      l.text.toLowerCase().includes('buscar') ||
      l.text.toLowerCase().includes('reporte') ||
      l.href.toLowerCase().includes('desaparecido')
    );
    
    if (targetLink) {
      console.log(`Found relevant link: ${targetLink.text} -> ${targetLink.href}`);
      console.log(`Navigating to ${targetLink.href}`);
      await page.goto(targetLink.href, { waitUntil: 'networkidle0', timeout: 30000 });
      
      const text = await page.evaluate(() => document.body.innerText);
      console.log("Extracted text from target page:");
      console.log(text.slice(0, 1500));
    } else {
      console.log("No relevant links found. Just dumping the homepage text:");
      const text = await page.evaluate(() => document.body.innerText);
      console.log(text.slice(0, 1500));
    }

  } catch(e) {
    console.log("Error:", e.message);
  } finally {
    if (browser) await browser.close();
    process.exit(0);
  }
})();
