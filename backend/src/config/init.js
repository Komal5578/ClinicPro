const fs = require('fs');
const path = require('path');

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL } = require('./env');

/**
 * Auto-initialize database schema on startup
 * Runs only if tables don't exist yet
 */
async function initializeSchema() {
  if (!DATABASE_URL && (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)) {
    return;
  }

  try {
    const { Client } = require('pg');
    const dbUrl = DATABASE_URL;
    
    if (!dbUrl) {
      return;
    }

    const client = new Client({ connectionString: dbUrl });
    await client.connect();

    // Quick check: does reminder table exist?
    const result = await client.query(
      "SELECT to_regclass('public.reminder')"
    );

    await client.end();

    if (result.rows[0].to_regclass !== null) {
      return;
    }

    // Table doesn't exist — apply schema
    console.log('[INIT] Creating database schema...');

    const schemaPath = path.join(__dirname, '../../../database/schema/supabase_schema.sql');
    if (!fs.existsSync(schemaPath)) {
      console.warn('[INIT] Schema file not found at:', schemaPath);
      return;
    }

    const sql = fs.readFileSync(schemaPath, 'utf8');
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    console.log(`[INIT] Executing ${statements.length} SQL statements...`);

    const applyClient = new Client({ connectionString: dbUrl });
    await applyClient.connect();

    let success = 0;
    for (const statement of statements) {
      try {
        await applyClient.query(statement);
        success++;
      } catch (err) {
        if (!err.message.includes('already exists')) {
          console.warn(`[INIT] Warning:`, err.message.substring(0, 80));
        }
      }
    }

    await applyClient.end();
    console.log(`[INIT] ✓ Schema applied successfully (${success}/${statements.length} statements)`);

  } catch (err) {
    console.log('[INIT] Schema init skipped:', err.message);
  }
}

module.exports = { initializeSchema };
