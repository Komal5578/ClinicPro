const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in .env');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createTables() {
  try {
    console.log('[SCHEMA] Creating critical tables...');

    // Test 1: Create reminder table
    const { error: remError } = await supabaseAdmin.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS reminder (
          reminder_id BIGSERIAL PRIMARY KEY,
          patient_id BIGINT,
          appointment_id BIGINT,
          reminder_type TEXT NOT NULL,
          scheduled_for TIMESTAMP WITH TIME ZONE,
          sent BOOLEAN DEFAULT FALSE,
          sent_at TIMESTAMP WITH TIME ZONE,
          message_txt TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_reminder_patient ON reminder(patient_id);
        CREATE INDEX IF NOT EXISTS idx_reminder_scheduled ON reminder(scheduled_for, sent);
      `
    }).catch(() => ({ error: null })); // RPC may not exist, ignore

    // Try direct query via select (workaround to test connectivity)
    const { data, error: testError } = await supabaseAdmin
      .from('reminder')
      .select('COUNT(*)', { count: 'exact' })
      .limit(1);

    if (!testError) {
      console.log('[SCHEMA] ✓ Reminder table exists!');
      return true;
    }

    console.log('[SCHEMA] ⚠️  Could not verify schema via Supabase admin client.');
    console.log('[SCHEMA] Manual fix required - apply schema via:');
    console.log('[SCHEMA] 1. Go to Supabase Dashboard → SQL Editor');
    console.log('[SCHEMA] 2. Open "New Query"');
    console.log('[SCHEMA] 3. Paste entire database/schema/supabase_schema.sql');
    console.log('[SCHEMA] 4. Click Run');
    console.log('[SCHEMA] Then restart: npm run dev');
    
    return false;
  } catch (err) {
    console.error('[SCHEMA] Error:', err.message);
    return false;
  }
}

createTables().then(success => {
  if (success) {
    console.log('[SCHEMA] All tables ready!');
  }
  process.exit(success ? 0 : 1);
});
