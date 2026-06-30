const pool = require('./db');
(async () => {
  try {
    const [result] = await pool.query(
      "UPDATE desaparecidos SET foto_url = NULL WHERE foto_url LIKE '%supabase.co%'"
    );
    console.log(`Corregidos ${result.affectedRows} registros que tenían fotos repetidas.`);
    process.exit(0);
  } catch(e) {
    console.log("Error:", e.message);
  }
})();
