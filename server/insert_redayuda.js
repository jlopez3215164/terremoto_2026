const puppeteer = require('puppeteer');
const pool = require('./db');

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    console.log("Navigating to https://redayudavenezuela.com/desaparecidos");
    await page.goto('https://redayudavenezuela.com/desaparecidos', { waitUntil: 'networkidle0', timeout: 30000 });
    
    const reports = await page.evaluate(() => {
      // The data seems to be grouped as: Name (maybe with age), Location, "Sin contacto"
      const text = document.body.innerText;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      let results = [];
      let current = null;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Skip header lines
        if (line.includes('43.602 personas') || line.includes('Sincronizado') || line.includes('Importar') || line.includes('Reportar') || line.includes('Inicio') || line.includes('Red de')) continue;
        
        if (line === 'Sin contacto' || line === 'Localizada' || line === 'A salvo') {
          if (current) {
            current.estado = line === 'Sin contacto' ? 'desaparecido' : 'encontrado_vivo';
            results.push(current);
            current = null;
          }
        } else {
          // If we don't have a current report, start one
          if (!current) {
            // Check if it's a name (starts with capital, 2-4 words)
            if (line.match(/^[A-Z][a-z]+ /)) {
               const parts = line.split(',');
               current = { name: parts[0].trim(), edad: parts[1] ? parseInt(parts[1].trim()) : null, loc: '' };
            }
          } else {
             // Second line before status is location
             current.loc = line;
          }
        }
      }
      return results;
    });

    console.log(`Found ${reports.length} reports in redayudavenezuela!`);
    
    let count = 0;
    for (const r of reports) {
      if (!r.name) continue;
      const zona_id = Math.floor(Math.random() * 5) + 1;
      
      try {
        await pool.query(
          `INSERT INTO desaparecidos (nombre_completo, edad, ultima_ubicacion, estado, zona_id, reportado_por, telefono_reportante) 
           VALUES (?, ?, ?, ?, ?, 'RedAyudaVenezuela', '0000-0000000')`,
          [r.name, r.edad, r.loc || 'No especificada', r.estado || 'desaparecido', zona_id]
        );
        count++;
      } catch(e) {}
    }
    console.log(`Successfully inserted ${count} reports.`);

  } catch(e) {
    console.log("Error:", e.message);
  } finally {
    if (browser) await browser.close();
    process.exit(0);
  }
})();
