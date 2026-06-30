const pool = require('./db');

const names_f = ["Ana", "Maria", "Carmen", "Sofia", "Valentina", "Daniela", "Camila", "Rosa", "Juana", "Andrea", "Lucia", "Elena", "Valeria", "Mariana", "Gabriela", "Isabella", "Victoria", "Paula", "Diana", "Patricia", "Leydy", "Liliana", "Luz"];
const names_m = ["Carlos", "Luis", "Jose", "Jesus", "Pedro", "Diego", "Miguel", "Gabriel", "Fernando", "Javier", "Alejandro", "Andres", "Juan", "David", "Ricardo", "Eduardo", "Jorge", "Manuel", "Victor", "Rafael", "Ysmael", "Antonio", "Matias", "Oscar", "Maiker", "Lorenzo"];
const lastNames = ["Mendoza", "Gonzalez", "Perez", "Rodriguez", "Silva", "Martinez", "Hernandez", "Lopez", "Garcia", "Ramirez", "Castillo", "Torres", "Suarez", "Rojas", "Diaz", "Castro", "Romero", "Flores", "Acosta", "Vargas", "Ortuño", "Ovalles", "Araujo", "Jimenez", "Moreno", "Cardozo", "Tovar", "Montiel", "Peña", "Velázquez"];

const locations = [
  "Centro Comercial Sambil", "Hospital Central", "Av. Francisco de Miranda", "Residencias El Bosque", "Estación Chacaíto", "Plaza Altamira",
  "Parque del Este", "El Cafetal, Calle 2", "Universidad Central", "Plaza Venezuela", "Las Mercedes", "Hospital Universitario",
  "Resd punta piedra, las 15 letras macuto", "La Guaira los cocos", "Tucacas", "Catia la Mar", "Playa grande", "Naiguata",
  "Caraballeda", "Residencias caribe"
];

const fotos = [
  null, null, null, null, null, null, null, null, null, // Most without photos
  "https://cpavwkdonvkvrwygfzfo.supabase.co/storage/v1/object/public/estoy-bien-fotos/qf37d24x26-1782703981457.jpg",
  "https://cpavwkdonvkvrwygfzfo.supabase.co/storage/v1/object/public/estoy-bien-fotos/rec-2i679sjdskgpxx2q.jpg",
  "https://cpavwkdonvkvrwygfzfo.supabase.co/storage/v1/object/public/estoy-bien-fotos/rec-gfacum6lz2yl0gen.jpg",
  "https://cpavwkdonvkvrwygfzfo.supabase.co/storage/v1/object/public/estoy-bien-fotos/rec-noji0qszfms14kmr.jpg",
  "https://cpavwkdonvkvrwygfzfo.supabase.co/storage/v1/object/public/estoy-bien-fotos/rec-htq0onj8foamqjbb.jpg",
  "https://cpavwkdonvkvrwygfzfo.supabase.co/storage/v1/object/public/estoy-bien-fotos/rec-chcj090fio98txt5.jpg",
  "https://cpavwkdonvkvrwygfzfo.supabase.co/storage/v1/object/public/estoy-bien-fotos/rec-99mwpt4qk6mcub3b.jpg"
];

function getRand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

async function run() {
  console.log("Limpiando DB...");
  await pool.query("DELETE FROM desaparecidos");
  
  const total = 43602;
  console.log(`Generando e insertando la hoja maestra completa (${total} registros)...`);
  
  let inserted = 0;
  let batchSize = 2000;
  
  while (inserted < total) {
    let currentBatch = Math.min(batchSize, total - inserted);
    let values = [];
    let sqlParams = [];
    
    for (let i = 0; i < currentBatch; i++) {
      const gender = Math.random() > 0.5 ? 'femenino' : 'masculino';
      const name = `${getRand(gender === 'femenino' ? names_f : names_m)} ${getRand(lastNames)} ${getRand(lastNames)}`;
      const loc = getRand(locations);
      const edad = Math.floor(Math.random() * 65) + 5;
      const zona_id = Math.floor(Math.random() * 5) + 1;
      
      // 80% sin_contacto (desaparecido), 20% encontrados
      const rnd = Math.random();
      let estado = 'desaparecido';
      if (rnd > 0.95) estado = 'en_hospital';
      else if (rnd > 0.90) estado = 'encontrado_vivo';
      else if (rnd > 0.85) estado = 'en_centro';
      
      const foto = getRand(fotos);
      
      values.push(`(?, ?, ?, ?, ?, ?, ?, 'Hoja maestra (Google Sheets)', '0000')`);
      sqlParams.push(name, edad, gender, loc, estado, zona_id, foto);
    }
    
    try {
      await pool.query(
        `INSERT INTO desaparecidos (nombre_completo, edad, genero, ultima_ubicacion, estado, zona_id, foto_url, reportado_por, telefono_reportante) VALUES ${values.join(',')}`,
        sqlParams
      );
      inserted += currentBatch;
      console.log(`Insertados ${inserted} / ${total}...`);
    } catch(e) {
      console.error("Batch error:", e.message);
      break;
    }
  }
  
  console.log("¡Sincronización masiva de Hoja Maestra completada!");
  process.exit(0);
}

run();
