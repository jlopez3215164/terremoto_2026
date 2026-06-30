const pool = require('./db');

const ZONAS_COORDS = {
  'Distrito Capital': { lat: 10.48, lng: -66.87 },
  'La Guaira': { lat: 10.60, lng: -66.93 },
  'Carabobo': { lat: 10.19, lng: -67.97 },
  'Aragua': { lat: 10.23, lng: -67.56 },
  'Miranda': { lat: 10.25, lng: -66.15 },
  'Delta Amacuro': { lat: 8.81, lng: -61.64 },
  'Bolívar': { lat: 6.17, lng: -63.53 },
  'Yaracuy': { lat: 10.33, lng: -68.74 },
  'Monagas': { lat: 9.31, lng: -63.02 },
  'Zulia': { lat: 9.84, lng: -72.06 },
  'Falcón': { lat: 11.23, lng: -69.86 },
};

async function updateCoords() {
  try {
    const [centros] = await pool.query(`
      SELECT c.id, c.direccion, z.nombre as zona_nombre 
      FROM centros_donacion c
      LEFT JOIN zonas z ON c.zona_id = z.id
      WHERE c.latitud IS NULL OR c.latitud = ''
    `);

    console.log(`Encontrados ${centros.length} centros sin coordenadas.`);
    
    let updated = 0;
    for (const c of centros) {
      if (!c.zona_nombre) continue;
      
      const baseCoord = ZONAS_COORDS[c.zona_nombre];
      if (baseCoord) {
        // Random offset entre -0.04 y +0.04 grados para esparcirlos
        const latOffset = (Math.random() - 0.5) * 0.08;
        const lngOffset = (Math.random() - 0.5) * 0.08;
        
        const newLat = (baseCoord.lat + latOffset).toFixed(5);
        const newLng = (baseCoord.lng + lngOffset).toFixed(5);
        
        await pool.query('UPDATE centros_donacion SET latitud = ?, longitud = ? WHERE id = ?', [newLat, newLng, c.id]);
        updated++;
      }
    }
    console.log(`Actualizados ${updated} centros con coordenadas aproximadas.`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

updateCoords();
