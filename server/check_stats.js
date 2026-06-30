const pool = require('./db');
(async () => {
  try {
    const [rows] = await pool.query(
      "SELECT estado, COUNT(*) as count FROM desaparecidos GROUP BY estado"
    );
    console.log(rows);
    process.exit(0);
  } catch(e) {
    console.log("Error:", e.message);
  }
})();
