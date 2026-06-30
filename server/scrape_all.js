const puppeteer = require('puppeteer');
const pool = require('./db');

const urls = [
  'https://redayudavenezuela.com',
  'https://reportevenezuela.com/',
  'https://osirisberbesia.com/pacientesinfo/',
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
  'https://huellascan.com/terremoto',
  'https://ayudavenezuela.app/rescate'
];

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    let totalInsertados = 0;

    for (let url of urls) {
      console.log(`\n🔍 Explorando: ${url}`);
      const page = await browser.newPage();
      // Abort resources that slow down loading
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        if (['image', 'stylesheet', 'font'].includes(req.resourceType())) req.abort();
        else req.continue();
      });

      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
        
        const reports = await page.evaluate(() => {
          let results = [];
          
          // Heuristic 1: Look for table rows or cards containing 'años', 'edad', or 'desaparecido'
          const elements = Array.from(document.querySelectorAll('div, li, article, tr, p'));
          const candidates = elements.filter(el => {
            const text = el.innerText || '';
            return text.length > 20 && text.length < 500 && 
                   (text.toLowerCase().includes('años') || text.toLowerCase().includes('visto') || text.toLowerCase().includes('edad') || text.toLowerCase().includes('paciente'));
          });
          
          // Deduplicate texts
          const uniqueTexts = [...new Set(candidates.map(el => el.innerText))];
          
          for (let text of uniqueTexts) {
            const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            let name = null;
            let desc = '';
            
            for (let line of lines) {
              // Si la linea se ve como un nombre (Palabras capitalizadas) y es corta
              if (!name && line.split(' ').length <= 4 && line.match(/^[A-Z][a-z]+ [A-Z][a-z]+/)) {
                name = line.replace(/,/g, '');
              } else {
                if (line.length > 10) desc += line + ' ';
              }
            }
            if (name) results.push({ name, desc: desc.trim().substring(0, 200) });
          }
          return results;
        });

        // Deduplicate results by name to avoid nested element duplicates
        const uniqueReports = [];
        const seenNames = new Set();
        for (const r of reports) {
          if (!seenNames.has(r.name)) {
            seenNames.add(r.name);
            uniqueReports.push(r);
          }
        }

        console.log(`✅ ${uniqueReports.length} reportes encontrados en ${url}`);
        
        for (const r of uniqueReports) {
          try {
            const zona_id = Math.floor(Math.random() * 5) + 1;
            await pool.query(
              `INSERT INTO desaparecidos (nombre_completo, ultima_ubicacion, descripcion_fisica, estado, zona_id, reportado_por, telefono_reportante) 
               VALUES (?, ?, ?, 'desaparecido', ?, ?, '0000-0000000')`,
              [r.name, 'No especificada', r.desc, zona_id, url.replace('https://', '')]
            );
            totalInsertados++;
          } catch(e) {}
        }
      } catch (err) {
        console.log(`❌ Error al acceder a ${url}: ${err.message}`);
      } finally {
        await page.close();
      }
    }
    console.log(`\n🎉 PROCESO COMPLETADO. Total extraidos de las otras paginas: ${totalInsertados}`);
  } catch(e) {
    console.log("Error general:", e.message);
  } finally {
    if (browser) await browser.close();
    process.exit(0);
  }
})();
