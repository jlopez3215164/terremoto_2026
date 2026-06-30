const puppeteer = require('puppeteer');
(async () => {
  let browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  
  await page.goto('http://localhost:5173/desaparecidos', { waitUntil: 'networkidle2' });
  
  // Find a button containing "Lo encontré"
  const button = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Lo encontré'));
  });
  
  if (button) {
    console.log("Button found. Clicking...");
    await button.click();
    await new Promise(r => setTimeout(r, 2000));
    
    // Check if modal text is visible
    const modalVisible = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('h2')).find(h => h.innerText.includes('¡Lo encontré!'));
      return el ? true : false;
    });
    console.log("Is modal visible?", modalVisible);
  } else {
    console.log("Button not found");
  }
  
  await browser.close();
})();
