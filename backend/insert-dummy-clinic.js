const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function insertDummyClinic() {
  try {
    const connection = await pool.getConnection();
    
    // Insert dummy clinic with valid GST format: 27AABCT1111A1Z5
    const query = `
      INSERT IGNORE INTO Clinic 
      (clinic_name, address, gst_number, sector, morning_start, morning_end, evening_start, evening_end, latitude, longitude) 
      VALUES 
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      'Demo Clinic - Testing',
      'Test Address, Mumbai',
      '27AABCT1111A1Z5',  // Valid GST format
      'GENERAL',
      '09:00:00',
      '13:00:00',
      '17:00:00',
      '21:00:00',
      '19.0760',  // Mumbai coordinates
      '72.8777'
    ];
    
    const [result] = await connection.execute(query, values);
    connection.release();
    
    console.log('✅ Dummy clinic inserted successfully!');
    console.log('GST Number: 27AABCT1111A1Z5');
    console.log('Use this GST number to register staff/receptionist');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error inserting dummy clinic:', err.message);
    process.exit(1);
  }
}

insertDummyClinic();
