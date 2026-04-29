const { Client } = require('pg');

async function createReminderTable() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('Please set DATABASE_URL in your environment (Postgres connection string).');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  const sql = `
CREATE TABLE IF NOT EXISTS reminder (
  reminder_id BIGSERIAL PRIMARY KEY,
  patient_id BIGINT,
  appointment_id BIGINT,
  reminder_type TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  message_txt TEXT
);

CREATE INDEX IF NOT EXISTS idx_reminder_patient ON reminder(patient_id);
CREATE INDEX IF NOT EXISTS idx_reminder_scheduled ON reminder(scheduled_for, sent);
`;

  try {
    await client.connect();
    console.log('Connected to database, creating reminder table...');
    await client.query(sql);
    console.log('Reminder table created (or already existed).');
  } catch (err) {
    console.error('Failed to create reminder table:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createReminderTable();
