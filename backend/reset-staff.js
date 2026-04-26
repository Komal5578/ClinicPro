const bcrypt = require('bcryptjs');
const db = require('./src/config/db');

async function reset() {
  const hash = await bcrypt.hash('password123', 10);
  const [r] = await db.query('UPDATE staff SET password_hash = ? WHERE email = ?', [hash, 'staff1@clinic.local']);
  console.log('Rows updated:', r.affectedRows);
  process.exit();
}

reset();