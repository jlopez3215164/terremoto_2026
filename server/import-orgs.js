const fs = require('fs');
const pool = require('./db');

async function importData() {
  try {
    const fileContent = fs.readFileSync('/Users/pc/.gemini/antigravity-ide/brain/740f108a-3f5c-4fd5-a501-6795af2bec68/.system_generated/steps/174/content.md', 'utf8');
    
    // Buscar el JSON
    const lines = fileContent.split('\n');
    const jsonLine = lines.find(line => line.trim().startsWith('[{'));
    if (!jsonLine) {
      console.log('No JSON found');
      process.exit(1);
    }
    
    const orgs = JSON.parse(jsonLine.trim());
    console.log(`Encontradas ${orgs.length} organizaciones. Importando...`);
    
    // Obtener y crear zonas únicas (por estado)
    const estados = [...new Set(orgs.map(o => o.estado).filter(Boolean))];
    
    for (const estado of estados) {
      const [rows] = await pool.execute('SELECT id FROM zonas WHERE estado_region = ?', [estado]);
      if (rows.length === 0) {
        await pool.execute("INSERT INTO zonas (nombre, ciudad, estado_region, nivel_afectacion) VALUES (?, ?, ?, 'grave')", 
          [estado, 'General', estado]);
      }
    }
    console.log('Zonas insertadas.');
    
    // Obtener mapa de zonas
    const [zonasRows] = await pool.execute('SELECT id, estado_region FROM zonas');
    const zonasMap = {};
    zonasRows.forEach(z => {
      zonasMap[z.estado_region] = z.id;
    });
    
    // Insertar centros de donación
    let count = 0;
    for (const org of orgs) {
      const zonaId = zonasMap[org.estado] || null;
      const direccionCompleta = org.direccion ? `${org.ciudad}, ${org.direccion}` : org.ciudad || 'No especificada';
      
      const tipo = org.tipo || 'general';
      const horario = org.horario ? `Horario: ${org.horario}` : 'Sin horario especificado';
      
      // Verificar si ya existe
      const [exist] = await pool.execute('SELECT id FROM centros_donacion WHERE nombre = ?', [org.nombre]);
      
      if (exist.length === 0) {
        await pool.execute(
          'INSERT INTO centros_donacion (nombre, direccion, zona_id, contacto, telefono, tipos_ayuda, descripcion) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            org.nombre || 'Desconocido', 
            direccionCompleta.substring(0, 300), 
            zonaId, 
            (org.contactoNombre || '').substring(0, 100), 
            (org.contactoTelefono || '').substring(0, 20), 
            tipo.substring(0, 500), 
            horario
          ]
        );
        count++;
      }
    }
    
    console.log(`¡Importación completada exitosamente! ${count} organizaciones nuevas insertadas.`);
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error importando datos:', error);
    await pool.end();
    process.exit(1);
  }
}

importData();
