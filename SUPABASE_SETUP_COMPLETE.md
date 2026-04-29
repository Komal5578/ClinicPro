# ClinicPro Supabase Setup Guide

## Current Status
- ✓ Backend running on port 5000
- ✓ Supabase client connected (SUPABASE_URL + SUPABASE_ANON_KEY configured)
- ✓ Auth middleware supports token verification
- ⏳ Database schema not yet applied (tables don't exist)

## Complete Setup in 2 Steps

### Step 1: Add Service Role Key (2 min)
This key lets the server verify Supabase tokens with full admin access.

1. Go to Supabase Dashboard → Settings → API
2. Copy the **Service Role Key** (starts with `eyJ...`)
3. Add to `backend/.env`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=<paste-your-service-role-key-here>
   ```
4. Restart backend: `npm run dev`

### Step 2: Apply Database Schema (3 min)
This creates all required tables (reminder, patient, doctor, etc).

**Option A: Via Supabase UI (Easiest)**
1. Open Supabase Dashboard → SQL Editor
2. Create new query
3. Copy-paste entire content from `database/schema/supabase_schema.sql`
4. Run query (click "►" or Ctrl+Enter)
5. Wait for completion

**Option B: Via CLI (if psql installed)**
```powershell
# Replace [YOUR-PASSWORD] with your actual Supabase database password
psql "postgresql://postgres:[YOUR-PASSWORD]@db.zbnoagxioabwcrabiyjt.supabase.co:5432/postgres" -f database/schema/supabase_schema.sql
```

**Option C: Via Admin Script (after adding service role key)**
```powershell
cd backend
node scripts/apply_schema_admin.js
```

## Verification Checklist
After completing steps 1 & 2, run:

```powershell
# 1. Verify server starts cleanly
cd backend
npm run dev
# Expected: "✓ Supabase connected successfully"

# 2. Verify reminder table exists and job runs
# Check logs for: "Reminder job started"
# (Once schema is applied, you should see reminder processing, not skip)

# 3. Test auth endpoint (optional)
curl -X GET http://localhost:5000/
# Expected: { "message": "ClinicPro API running" }
```

## Troubleshooting

**Problem: "Could not find the table 'public.reminder'"**
- Solution: Apply schema using Option A, B, or C above

**Problem: Service role key not accepted**
- Check: Key starts with `eyJ...` (JWT format)
- Check: Copy-pasted exactly (no extra spaces)
- Check: Restarted server after adding to .env

**Problem: psql command not found**
- Solution: Use Option A (Supabase UI) — no setup needed

**Problem: SQL syntax errors during apply**
- Likely already applied — ignore and continue
- Schema includes `CREATE TABLE IF NOT EXISTS` guards

## File Reference
- Backend server: `backend/server.js`
- Env config: `backend/.env` (contains secrets, do NOT commit)
- Env template: `backend/.env.example`
- Schema: `database/schema/supabase_schema.sql`
- Auth middleware: `backend/src/middleware/auth.middleware.js`
- Reminder job: `backend/src/jobs/reminder.job.js`

## Next Steps
Once schema is applied:
1. Reminders will process automatically (every minute via cron)
2. Frontend can authenticate via Supabase Auth
3. All API routes will work with token verification

Questions? Check logs: `npm run dev` shows all connection details.
