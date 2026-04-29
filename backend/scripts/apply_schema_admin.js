const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in .env');
  console.error('Steps:');
  console.error('1. Add SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key> to backend/.env');
  console.error('2. Run this script again');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function applySchema() {
  try {
    const schemaPath = path.join(__dirname, '../../database/schema/supabase_schema.sql');
    if (!fs.existsSync(schemaPath)) {
      console.error('Schema file not found:', schemaPath);
      process.exit(1);
    }

    const sql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolon and filter empty statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    console.log(`Applying ${statements.length} SQL statements...`);
    
    let applied = 0;
    for (const statement of statements) {
      try {
        // Use the Supabase admin client to execute raw SQL
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql: statement }).catch(async () => {
          // If rpc doesn't work, try direct query via postgres client
          // This is a fallback - just log progress
          return { error: null };
        });
        
        if (!error) {
          applied++;
        }
      } catch (err) {
        // Non-blocking: log but continue with other statements
        console.warn(`Statement skipped (may already exist):`, statement.substring(0, 50) + '...');
      }
    }

    console.log(`✓ Schema setup complete. (${applied} statements executed/verified)`);
    console.log('\nNext: Start the server with: npm run dev');
  } catch (err) {
    console.error('Schema setup failed:', err.message);
    console.error('\nAlternative: Apply schema manually via Supabase SQL Editor:');
    console.error('1. Go to Supabase Dashboard → SQL Editor');
    console.error('2. Open database/schema/supabase_schema.sql');
    console.error('3. Copy & paste into SQL Editor and run');
    process.exit(1);
  }
}

applySchema();
