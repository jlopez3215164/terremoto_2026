const puppeteer = require('puppeteer');
const pool = require('./db');

const catMap = {
  'otro': 'Otra irregularidad',
  'ninos': 'Riesgo de niños',
  'desaparecido': 'Persona desaparecida',
  'desvio': 'Desvío o robo de ayuda',
  'fraude': 'Fraude o estafa',
  'abuso': 'Abuso de autoridad'
};

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new', args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  let apiData = null;
  
  page.on('response', async (res) => {
    if (res.url().includes('api/data') && !apiData) {
      try { const j = await res.json(); if (j.data) apiData = j.data; } catch(e) {}
    }
  });

  await page.goto('https://redayudavenezuela.com/comunidad', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  
  if (!apiData) { console.log("No API data!"); process.exit(1); }
  console.log(`Got ${apiData.length} denuncias from API`);

  await pool.query("DELETE FROM noticias");
  
  let count = 0;
  for (const d of apiData) {
    const cat = catMap[d.category] || d.category || 'Denuncia';
    const titulo = `[${cat}] ${d.city || 'Venezuela'}`.substring(0, 255);
    const resumen = d.title || d.description || '';
    
    // Build images JSON array
    let imagenes = [];
    if (d.photo_url) imagenes.push(d.photo_url);
    if (d.photos && Array.isArray(d.photos)) {
      for (const p of d.photos) {
        if (typeof p === 'string') imagenes.push(p);
        else if (p.url) imagenes.push(p.url);
      }
    }
    
    try {
      await pool.query(
        "INSERT INTO noticias (titulo, resumen, imagenes, autor_id) VALUES (?, ?, ?, 1)",
        [titulo, resumen, imagenes.length > 0 ? JSON.stringify(imagenes) : null]
      );
      count++;
    } catch(e) { console.log("Err:", e.message); }
  }
  
  console.log(`✅ Insertadas ${count} noticias con imágenes`);
  
  const [stats] = await pool.query("SELECT COUNT(*) as total, SUM(imagenes IS NOT NULL) as con_img FROM noticias");
  console.log(`Total: ${stats[0].total}, Con imagen: ${stats[0].con_img}`);
  
  await browser.close();
  process.exit(0);
})();
