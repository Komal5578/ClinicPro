const db = require('../src/config/db');

(async () => {
  try {
    console.log('Checking Clinic table (latest 10):');
    const [clinics] = await db.query('SELECT * FROM Clinic ORDER BY clinic_id DESC LIMIT 10');
    console.log(JSON.stringify(clinics, null, 2));

    console.log('\nChecking Doctor table (latest 10):');
    const [doctors] = await db.query('SELECT * FROM Doctor ORDER BY doctor_id DESC LIMIT 10');
    console.log(JSON.stringify(doctors, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('DB query failed:', err.message);
    process.exit(2);
  }
})();
