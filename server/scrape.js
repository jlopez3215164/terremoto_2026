const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log('Iniciando Puppeteer...');
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  // Interceptar requests para no cargar imágenes y ahorrar tiempo
  await page.setRequestInterception(true);
  page.on('request', req => {
    if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });

  console.log('Navegando a la página...');
  await page.goto('https://ayudaencamino.com/organizaciones', { waitUntil: 'networkidle2' });
  
  // Esperar un par de segundos extra para asegurar el renderizado
  await new Promise(r => setTimeout(r, 3000));
  
  console.log('Extrayendo HTML...');
  const html = await page.evaluate(() => document.body.innerHTML);
  fs.writeFileSync('page_content.html', html);
  
  console.log('Extrayendo Texto Plano...');
  const text = await page.evaluate(() => document.body.innerText);
  fs.writeFileSync('page_content.txt', text);
  
  console.log('Datos guardados en page_content.html y page_content.txt');
  await browser.close();
})();
