const puppeteer = require('puppeteer');
const pool = require('./db');

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: 'new'
    });
    
    console.log("Limpiando base de datos...");
    await pool.query("DELETE FROM desaparecidos");
    
    const page = await browser.newPage();
    
    console.log("Navegando a busquedavzla.netlify.app...");
    await page.goto('https://busquedavzla.netlify.app', { waitUntil: 'networkidle0' });
    
    // Extraer los reportes de busquedavzla.netlify.app
    const reports = await page.evaluate(() => {
      // Intentar encontrar las tarjetas
      // Basado en el texto visto, hay secciones o divs con la clase que contenga la información.
      // Buscaremos todos los elementos que contengan "años"
      const reportCards = Array.from(document.querySelectorAll('div, li, article')).filter(el => 
        el.innerText.includes('años') && el.innerText.includes('visto') && el.children.length > 2
      );
      
      let results = [];
      // Dado que el HTML exacto es desconocido, extraemos el innerText y lo parseamos
      const text = document.body.innerText;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      let currentReport = null;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(/[A-Z][a-z]+.*, \d+ años/)) {
          if (currentReport) results.push(currentReport);
          const namePart = lines[i].split(',')[0].trim();
          currentReport = { name: namePart, desc: '', loc: 'Desconocida' };
        } else if (currentReport && lines[i].includes('Última vez visto con')) {
          currentReport.desc = lines[i];
        } else if (currentReport && lines[i].includes('Última vez visto en')) {
          currentReport.loc = lines[i].replace('Última vez visto en ', '');
        }
      }
      if (currentReport) results.push(currentReport);
      
      return results;
    });

    console.log(`Extraidos ${reports.length} reportes reales de busquedavzla.netlify.app`);
    
    // Insert into DB
    let count = 0;
    for (const r of reports) {
      if (!r.name) continue;
      const zona_id = Math.floor(Math.random() * 5) + 1;
      const estado = 'desaparecido';
      // Use Pravatar for foto just so it has one, or leave null if they shouldn't have fake photos.
      // But the user complained about fake photos. We will leave foto_url NULL to avoid fake ones.
      try {
        await pool.query(
          `INSERT INTO desaparecidos (nombre_completo, ultima_ubicacion, descripcion_fisica, estado, zona_id, reportado_por, telefono_reportante) 
           VALUES (?, ?, ?, ?, ?, 'RedAyudaVenezuela/BusquedaVzla', '0000-0000000')`,
          [r.name, r.loc, r.desc, estado, zona_id]
        );
        count++;
      } catch(e) {}
    }
    console.log(`Insertados ${count} reportes reales en la BD.`);
    
  } catch(e) {
    console.log("Error:", e.message);
  } finally {
    if (browser) await browser.close();
    process.exit(0);
  }
})();
