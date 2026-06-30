const fs = require('fs');
const pool = require('./db');

async function updateNeeds() {
  try {
    const fileContent = fs.readFileSync('/Users/pc/.gemini/antigravity-ide/brain/740f108a-3f5c-4fd5-a501-6795af2bec68/.system_generated/steps/267/content.md', 'utf8');
    
    // Buscar el JSON
    const lines = fileContent.split('\n');
    const jsonLine = lines.find(line => line.trim().startsWith('[{'));
    if (!jsonLine) {
      console.log('No JSON found in needs data');
      process.exit(1);
    }
    
    const needsData = JSON.parse(jsonLine.trim());
    console.log(`Encontradas ${needsData.length} necesidades. Procesando...`);
    
    // Agrupar por organizacion.nombre
    const needsByOrg = {};
    for (const need of needsData) {
      if (!need.organizacion || !need.organizacion.nombre) continue;
      const orgName = need.organizacion.nombre;
      if (!needsByOrg[orgName]) needsByOrg[orgName] = [];
      needsByOrg[orgName].push(`${need.nombreArticulo} (${need.cantidadNecesaria - need.cantidadCumplida} faltan)`);
    }
    
    let updated = 0;
    for (const [orgName, items] of Object.entries(needsByOrg)) {
      const needsString = items.join(', ').substring(0, 500); // Truncar si es muy largo
      
      const [res] = await pool.execute(
        'UPDATE centros_donacion SET tipos_ayuda = ? WHERE nombre = ?',
        [needsString, orgName]
      );
      if (res.affectedRows > 0) updated++;
    }
    
    console.log(`¡Importación de necesidades completada! Se actualizaron ${updated} centros.`);
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error actualizando necesidades:', error);
    if (pool) await pool.end();
    process.exit(1);
  }
}

updateNeeds();
