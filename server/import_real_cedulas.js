const pool = require('./db');
const fs = require('fs');

(async () => {
  try {
    const data = JSON.parse(fs.readFileSync('real_people_with_cedulas.json', 'utf8'));
    let imported = 0;
    
    console.log(`Processing ${data.length} real records...`);
    
    for (const person of data) {
      let cedula = null;
      let textToSearch = (person.detail || '') + ' ' + (person.contact || '');
      
      // Try to find Venezuelan ID card patterns like "31 962 083", "13.147.176", "V-12345678"
      const match = textToSearch.match(/(?:[VvEe]-?|C\.?I\.?\s*)?\b([0-9]{1,2})[\s\.]?([0-9]{3})[\s\.]?([0-9]{3})\b/);
      if (match) {
        cedula = 'V-' + match[1] + match[2] + match[3];
      }
      
      const estadoMap = {
        'hospital': 'en_hospital',
        'refugio': 'en_centro',
        'desaparecido': 'desaparecido'
      };
      const estado = estadoMap[person.category] || 'desaparecido';
      
      // Insert into DB
      await pool.query(
        `INSERT INTO desaparecidos 
         (nombre_completo, cedula, edad, ultima_ubicacion, estado, descripcion_fisica, foto_url, reportado_por, telefono_reportante, category, label, detail, slug, contact)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'RedAyudaVenezuela', ?, ?, ?, ?, ?, ?)`,
        [
          person.name || 'Desconocido', 
          cedula, 
          person.age || null,
          person.loc || null, 
          estado, 
          person.detail || null, 
          person.photo_url || null,
          (person.contact || '0000').substring(0, 20),
          person.category || null,
          person.label || null,
          person.detail || null,
          person.slug || null,
          person.contact || null
        ]
      );
      imported++;
    }
    
    console.log(`Successfully imported ${imported} real records with their cedulas.`);
    
    // Regenerate CSV
    console.log('Regenerando el archivo CSV...');
    const [allRows] = await pool.query('SELECT * FROM desaparecidos');
    const columns = Object.keys(allRows[0]);
    const csvHeader = columns.join(',') + '\n';
    
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    const csvRows = allRows.map(row => columns.map(col => escapeCsv(row[col])).join(',')).join('\n');
    fs.writeFileSync('hoja_maestra_desaparecidos.csv', csvHeader + csvRows, 'utf8');
    
    console.log('¡Archivo CSV actualizado!');
    process.exit(0);
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  }
})();
