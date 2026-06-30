const puppeteer = require('puppeteer');

const domains = [
  'https://reportevenezuela.com',
  'https://osirisberbesia.com',
  'https://venapp.com',
  'https://desaparecidosterremotovenezuela.com',
  'https://venezuelatebusca.com',
  'https://terremotovenezuela.com',
  'https://hospitalesenvenezuela.com',
  'https://pacientesterremotovzla.lovable.app',
  'https://ayudavenezuela2026.com',
  'https://rescate-ve.vercel.app',
  'https://refugiosvenezuela.com',
  'https://ayudaparavenezuela.com',
  'https://huellascan.com',
  'https://ayudavenezuela.app'
];

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    for (let domain of domains) {
      console.log(`\n🔍 Deep scanning: ${domain}`);
      const page = await browser.newPage();
      
      let apiFound = false;
      page.on('response', async (res) => {
        const url = res.url();
        if (url.includes('api') || url.includes('json') || url.includes('supabase')) {
          apiFound = true;
        }
      });
      
      const pathsToTry = ['', '/desaparecidos', '/reportes'];
      let foundData = false;
      
      for (let p of pathsToTry) {
        if (foundData) break;
        const targetUrl = `${domain}${p}`;
        try {
          await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 5000 });
          // Check for keywords
          const hasData = await page.evaluate(() => {
            const text = document.body.innerText.toLowerCase();
            return text.includes('años') && text.includes('visto');
          });
          
          if (hasData || apiFound) {
            console.log(`✅ Possible data found at ${targetUrl} (API: ${apiFound}, TextMatch: ${hasData})`);
            foundData = true;
          }
        } catch(e) {
          // Ignore timeouts
        }
      }
      
      if (!foundData) {
        console.log(`❌ No hidden data or APIs found on ${domain}`);
      }
      await page.close();
    }
  } catch(e) {
    console.log("Error:", e.message);
  } finally {
    if (browser) await browser.close();
    process.exit(0);
  }
})();
