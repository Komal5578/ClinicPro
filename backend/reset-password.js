const bcrypt = require('bcryptjs');
const db = require('./src/config/db');

async function reset() {
  const hash = await bcrypt.hash('password123', 10);
  console.log('New hash:', hash);
  const [result] = await db.query(
    "UPDATE doctor SET password_hash = ? WHERE email = 'doctor@clinic.com'",
    [hash]
  );
  console.log('Rows updated:', result.affectedRows);
  process.exit();
}

reset();