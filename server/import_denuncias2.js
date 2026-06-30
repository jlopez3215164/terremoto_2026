const puppeteer = require('puppeteer');
const pool = require('./db');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();

  await page.goto('https://redayudavenezuela.com/comunidad', { waitUntil: 'networkidle0', timeout: 30000 });
  
  const denuncias = await page.evaluate(() => {
    const text = document.body.innerText;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    const categories = ['Otra irregularidad', 'Riesgo de niños', 'Persona desaparecida', 'Desvío o robo de ayuda', 'Fraude o estafa', 'Abuso de autoridad'];
    let results = [];
    let current = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (categories.includes(line)) {
        if (current && current.body.length > 20) results.push(current);
        current = { category: line, time: '', body: '', location: '' };
      } else if (current) {
        if (line.startsWith('hace ') && line.includes('h')) {
          current.time = line;
        } else if (line === 'Toca para ver la foto completa' || line === 'Apoyar' || line === 'Comentarios' || line.startsWith('· ') || line === 'Ver en el mapa') {
          // skip
        } else if (!current.body && line.length > 20) {
          current.body = line;
        } else if (current.body && !current.location && line.length > 3 && line.length < 100 && !line.startsWith('http') && !line.startsWith('Coordenadas')) {
          current.location = line;
        }
      }
    }
    if (current && current.body.length > 20) results.push(current);
    
    return results;
  });

  console.log(`Extracted ${denuncias.length} denuncias`);
  
  await pool.query("DELETE FROM noticias");
  
  let count = 0;
  for (const d of denuncias) {
    const titulo = `[${d.category}] ${d.location || 'Venezuela'}`.substring(0, 255);
    const resumen = d.body;
    
    try {
      await pool.query(
        "INSERT INTO noticias (titulo, resumen, autor_id) VALUES (?, ?, 1)",
        [titulo, resumen]
      );
      count++;
    } catch(e) {
      console.log("Error:", e.message);
    }
  }
  
  console.log(`✅ Insertadas ${count} noticias/denuncias reales`);
  
  await browser.close();
  process.exit(0);
})();
