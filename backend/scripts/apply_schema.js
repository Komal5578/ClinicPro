const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function applySchema() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('Please set DATABASE_URL in your environment (Postgres connection string).');
    process.exit(1);
  }

  const sqlPath = path.join(__dirname, '../../database/schema/supabase_schema.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('Schema file not found:', sqlPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    console.log('Connected to database, applying schema...');
    await client.query(sql);
    console.log('Schema applied successfully.');
  } catch (err) {
    console.error('Failed to apply schema:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applySchema();
