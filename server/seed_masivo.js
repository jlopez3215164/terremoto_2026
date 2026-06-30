const pool = require('./db');

const names_f = ["Ana", "Maria", "Carmen", "Sofia", "Valentina", "Daniela", "Camila", "Rosa", "Juana", "Andrea", "Lucia", "Elena", "Valeria", "Mariana", "Gabriela", "Isabella", "Victoria", "Paula", "Diana", "Patricia"];
const names_m = ["Carlos", "Luis", "Jose", "Jesus", "Pedro", "Diego", "Miguel", "Gabriel", "Fernando", "Javier", "Alejandro", "Andres", "Juan", "David", "Ricardo", "Eduardo", "Jorge", "Manuel", "Victor", "Rafael"];
const lastNames = ["Mendoza", "Gonzalez", "Perez", "Rodriguez", "Silva", "Martinez", "Hernandez", "Lopez", "Garcia", "Ramirez", "Castillo", "Torres", "Suarez", "Rojas", "Diaz", "Castro", "Romero", "Flores", "Acosta", "Vargas"];

const locations = [
  "Centro Comercial Sambil", "Hospital Central", "Av. Francisco de Miranda", 
  "Residencias El Bosque", "Estación Chacaíto", "Plaza Altamira", "Parque del Este",
  "El Cafetal, Calle 2", "Universidad Central", "Plaza Venezuela", "Las Mercedes",
  "Hospital Universitario", "Terminal de Pasajeros", "Macaracuay", "Autopista Francisco Fajardo"
];
const states = ['desaparecido', 'desaparecido', 'desaparecido', 'desaparecido', 'encontrado_vivo', 'en_hospital', 'en_centro'];

function getRand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

async function seed() {
  console.log("Limpiando DB...");
  await pool.query("DELETE FROM desaparecidos");
  
  console.log("Insertando 80 registros sintéticos con fotos...");
  
  let count = 0;
  for (let i = 1; i <= 80; i++) {
    // Pravatar uses ids from 1 to 70 for humans
    const imgId = i % 70 || 70;
    const gender = (imgId % 2 === 0) ? 'femenino' : 'masculino';
    
    let name = '';
    if (gender === 'femenino') name = `${getRand(names_f)} ${getRand(lastNames)}`;
    else name = `${getRand(names_m)} ${getRand(lastNames)}`;
    
    const loc = getRand(locations);
    const estado = getRand(states);
    const zona_id = Math.floor(Math.random() * 5) + 1;
    const foto = `https://i.pravatar.cc/300?img=${imgId}`;
    const edad = Math.floor(Math.random() * 50) + 18;
    
    await pool.query(
      `INSERT INTO desaparecidos (nombre_completo, edad, genero, ultima_ubicacion, estado, zona_id, foto_url, reportado_por, telefono_reportante) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Sistema Automático', '0414-0000000')`,
      [name, edad, gender, loc, estado, zona_id, foto]
    );
    count++;
  }
  
  console.log(`¡Se insertaron ${count} personas correctamente!`);
  process.exit(0);
}
seed();
