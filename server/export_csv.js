const fs = require('fs');
const pool = require('./db');

(async () => {
  try {
    console.log('Obteniendo registros de la base de datos...');
    const [rows] = await pool.query('SELECT * FROM desaparecidos');
    
    if (rows.length === 0) {
      console.log('No hay registros en la tabla desaparecidos.');
      process.exit(0);
    }
    
    console.log(`Generando CSV para ${rows.length} registros...`);
    
    // Obtener los nombres de las columnas
    const columns = Object.keys(rows[0]);
    
    // Crear la cabecera del CSV
    const csvHeader = columns.join(',') + '\n';
    
    // Función para escapar strings para CSV (maneja comillas, saltos de linea y comas)
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    // Crear las filas del CSV
    const csvRows = rows.map(row => {
      return columns.map(col => escapeCsv(row[col])).join(',');
    }).join('\n');
    
    // Guardar en el archivo
    fs.writeFileSync('hoja_maestra_desaparecidos.csv', csvHeader + csvRows, 'utf8');
    
    console.log('¡Archivo hoja_maestra_desaparecidos.csv creado con éxito!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
})();
