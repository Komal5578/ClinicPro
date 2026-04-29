const db = require('../src/config/db');

(async () => {
  const email = 'shravanidandekar251205@gmail.com';
  console.log(`\\n=== Checking exact email: ${email}`);

  const [doctors] = await db.query('SELECT * FROM doctor WHERE email = ?', [email]);
  console.log('\\nDoctors:', JSON.stringify(doctors, null, 2));

  const [staff] = await db.query('SELECT * FROM staff WHERE email = ?', [email]);
  console.log('\\nStaff:', JSON.stringify(staff, null, 2));

  console.log('\\n=== Test login data:');
  console.log('Role: doctor');
  console.log('Email: ' + email);
  console.log('Password: [your pw]');
  process.exit(0);
})();

