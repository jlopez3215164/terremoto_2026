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
          console.log(`Intercepted API: ${json.data.length} denuncias`);
        }
      } catch(e) {}
    }
  });

  await page.goto('https://redayudavenezuela.com/comunidad', { waitUntil: 'networkidle0', timeout: 30000 });
  
  // Also extract from the rendered page text as fallback
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
          // skip UI elements
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

  console.log(`Extracted ${denuncias.length} denuncias from page text`);
  
  // Check if we need admin user
  const [users] = await pool.query("SELECT id FROM usuarios WHERE role = 'admin' LIMIT 1");
  const autorId = users.length > 0 ? users[0].id : 1;
  
  // Clear old noticias
  await pool.query("DELETE FROM noticias");
  console.log("Cleared old noticias");
  
  let count = 0;
  for (const d of denuncias) {
    const titulo = `[${d.category}] ${d.location || 'Venezuela'}`;
    const resumen = d.body;
    
    try {
      await pool.query(
        "INSERT INTO noticias (titulo, resumen, autor_id) VALUES (?, ?, ?)",
        [titulo.substring(0, 255), resumen, autorId]
      );
      count++;
    } catch(e) {
      console.log("Insert error:", e.message);
    }
  }
  
  console.log(`Inserted ${count} noticias from denuncias`);
  
  await browser.close();
  process.exit(0);
})();
