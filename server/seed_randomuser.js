const https = require('https');
const pool = require('./db');

const locations = [
  "Centro Comercial Sambil", "Hospital Central", "Av. Francisco de Miranda", 
  "Residencias El Bosque", "Estación Chacaíto", "Plaza Altamira", "Parque del Este",
  "El Cafetal, Calle 2", "Universidad Central", "Plaza Venezuela", "Las Mercedes",
  "Hospital Universitario", "Terminal de Pasajeros", "Macaracuay", "Autopista Francisco Fajardo",
  "Catia", "Petare", "La Candelaria", "San Bernardino", "El Paraiso", "Montalban", "Caricuao"
];
const states = ['desaparecido', 'desaparecido', 'desaparecido', 'desaparecido', 'encontrado_vivo', 'en_hospital', 'en_centro'];

function getRand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

https.get('https://randomuser.me/api/?results=400&nat=es,br,mx', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', async () => {
    const users = JSON.parse(data).results;
    
    console.log("Limpiando DB actual...");
    await pool.query("DELETE FROM desaparecidos");
    
    console.log(`Insertando ${users.length} registros desde RandomUser (fotos más realistas y nombres hispanos)...`);
    
    let count = 0;
    for (const u of users) {
      const name = `${u.name.first} ${u.name.last}`;
      const gender = u.gender === 'female' ? 'femenino' : 'masculino';
      const loc = getRand(locations);
      const estado = getRand(states);
      const zona_id = Math.floor(Math.random() * 5) + 1;
      const foto = u.picture.large; // e.g. https://randomuser.me/api/portraits/men/75.jpg
      const edad = u.dob.age;
      
      try {
        await pool.query(
          `INSERT INTO desaparecidos (nombre_completo, edad, genero, ultima_ubicacion, estado, zona_id, foto_url, reportado_por, telefono_reportante) 
           VALUES (?, ?, ?, ?, ?, ?, ?, 'Sistema Automático', '0414-0000000')`,
          [name, edad, gender, loc, estado, zona_id, foto]
        );
        count++;
      } catch(e) {}
    }
    
    console.log(`¡Se insertaron ${count} personas correctamente!`);
    process.exit(0);
  });
});
