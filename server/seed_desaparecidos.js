const pool = require('./db');

const names = [
  "Carlos Mendoza", "Maria Gonzalez", "Luis Perez", "Ana Rodriguez", "Jose Silva", 
  "Carmen Martinez", "Jesus Hernandez", "Rosa Lopez", "Pedro Garcia", "Juana Ramirez",
  "Diego Castillo", "Sofia Torres", "Miguel Suarez", "Valentina Rojas", "Gabriel Diaz",
  "Andrea Castro", "Fernando Romero", "Camila Flores", "Javier Acosta", "Daniela Vargas"
];
const locations = [
  "Centro Comercial Sambil", "Hospital Central", "Av. Francisco de Miranda", 
  "Residencias El Bosque", "Estación Chacaíto", "Plaza Altamira"
];
const states = ['desaparecido', 'desaparecido', 'encontrado_vivo', 'en_hospital', 'en_centro', 'desaparecido'];
const descriptions = [
  "Llevaba camisa azul y pantalón negro.",
  "Estatura 1.70m, usa lentes de pasta.",
  "Cabello corto castaño, tenía una mochila roja.",
  "Visto por última vez ayudando en los escombros.",
  "Vestía uniforme médico blanco.",
  ""
];

async function seed() {
  console.log("Insertando datos sintéticos correctos...");
  
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const loc = locations[i % locations.length];
    const estado = states[i % states.length];
    const desc = descriptions[i % descriptions.length];
    // Random zona between 1 and 5
    const zona_id = Math.floor(Math.random() * 5) + 1;
    
    await pool.query(
      `INSERT INTO desaparecidos (nombre_completo, ultima_ubicacion, descripcion_fisica, estado, zona_id, reportado_por, telefono_reportante) 
       VALUES (?, ?, ?, ?, ?, 'Sistema Automático', '0414-0000000')`,
      [name, loc, desc, estado, zona_id]
    );
  }
  
  console.log("¡Datos insertados correctamente!");
  process.exit(0);
}
seed();
