const pool = require('./db');
(async () => {
  try {
    await pool.query("UPDATE desaparecidos SET estado = 'desaparecido' WHERE estado = 'en_hospital' LIMIT 1900");
    await pool.query("UPDATE desaparecidos SET estado = 'desaparecido' WHERE estado = 'en_centro' LIMIT 1900");
    
    const [rows] = await pool.query("SELECT estado, COUNT(*) as count FROM desaparecidos GROUP BY estado");
    console.log("Nuevos totales:", rows);
    process.exit(0);
  } catch(e) {
    console.log("Error:", e.message);
  }
})();
