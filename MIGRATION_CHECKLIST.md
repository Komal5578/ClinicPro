# ClinicPro Supabase Migration - Final Checklist

## ✅ Completed Setup Steps

- [x] **Installed Supabase dependencies** (@supabase/supabase-js)
- [x] **Created Supabase configuration** (backend/src/config/supabase.js)
- [x] **Updated database wrapper** (backend/src/config/db.js)
- [x] **Set up environment variables** (backend/.env)
- [x] **Generated PostgreSQL schema** (database/schema/supabase_schema.sql)
- [x] **Removed MySQL dependency** (mysql2 removed from package.json)
- [x] **Tested server connection** (✓ Supabase connected successfully)

---

## 📋 Required Next Steps

### Step 1: Create Database Schema in Supabase (🔴 CRITICAL)

1. Go to your Supabase project:
   - URL: https://zbnoagxioabwcrabiyjt.supabase.co/

2. Navigate to **SQL Editor** (left sidebar → SQL Editor)

3. Create a **New Query**

4. Copy and paste the entire content from:
   ```
   database/schema/supabase_schema.sql
   ```

5. Click the **RUN** button

6. Verify all tables are created successfully

**Why this matters:** Without creating these tables, your API will fail when trying to query the database.

---

### Step 2: Migrate Existing Data (Optional but Recommended)

If you have existing data in your old MySQL database:

#### Option A: Using Supabase UI
1. Export data from MySQL:
   ```bash
   mysqldump -h localhost -u root -p clinic_db > backup.sql
   ```

2. In Supabase SQL Editor, import the dump

3. Rename tables to match snake_case naming

#### Option B: Manual Migration Script
We can create a Node.js script to:
- Connect to old MySQL
- Extract data
- Transform and load into Supabase

#### Option C: Start Fresh
- Delete old MySQL database
- Use Supabase seed data if available

---

### Step 3: Test API Connections

1. Start the backend server:
   ```bash
   cd backend
   node server.js
   ```

2. Expected output:
   ```
   ◇ injected env (22) from backend\.env
   Server running on port 5000
   ✓ Supabase connected successfully
   ```

3. Test a simple endpoint:
   ```bash
   curl http://localhost:5000/
   ```

   Expected response:
   ```json
   {"message":"ClinicPro API running"}
   ```

---

### Step 4: Test API Operations

Test key endpoints to verify database operations work:

#### Register a Patient
```bash
curl -X POST http://localhost:5000/api/patients/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "9876543210",
    "age": 30,
    "email": "john@example.com"
  }'
```

#### Search Patient
```bash
curl http://localhost:5000/api/patients/search?phone=9876543210
```

#### Get Doctor Profile (requires auth token)
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/doctors/profile
```

---

### Step 5: Update Frontend (if applicable)

If your frontend has hardcoded backend URLs, update them:

```javascript
// Before (if pointing to old MySQL server)
const API_URL = 'http://old-mysql-server:5000';

// After (point to same server, which now uses Supabase)
const API_URL = 'http://localhost:5000';
// or in production
const API_URL = 'https://your-domain.com';
```

No frontend code changes needed - the backend handles the Supabase connection internally.

---

## 🔧 Troubleshooting

### Issue: "Table not found" errors

**Solution:**
1. Verify you ran the schema SQL in Supabase
2. Check table names are lowercase (PostgreSQL convention)
3. Ensure all foreign key references use correct table names

### Issue: "SUPABASE_URL and SUPABASE_ANON_KEY must be set"

**Solution:**
1. Verify `backend/.env` file exists
2. Check environment variable values are correct:
   ```
   SUPABASE_URL=https://zbnoagxioabwcrabiyjt.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Issue: Foreign key constraint violations

**Solution:**
- When inserting data, ensure parent records exist first
- Example: Create clinic before creating doctor_clinic relationships
- PostgreSQL enforces FK constraints strictly (unlike MySQL)

### Issue: "INSERT returns no insertId"

**Current Status:** The wrapper extracts insertId from returned record
**Workaround:** Check response includes `affectedRows: 1`

---

## 📚 Important Files

| File | Purpose |
|------|---------|
| `backend/.env` | Supabase credentials & API keys |
| `backend/src/config/db.js` | Database connection wrapper |
| `backend/src/config/supabase.js` | Supabase client initialization |
| `database/schema/supabase_schema.sql` | PostgreSQL schema for Supabase |
| `SUPABASE_MIGRATION_GUIDE.md` | Detailed migration documentation |

---

## ⚠️ Important Notes

1. **Security:** Never commit `.env` file to version control
   - Add `backend/.env` to `.gitignore`
   - Use environment variable secrets in production

2. **Data Types:** PostgreSQL handles some types differently than MySQL
   - ENUM values must be exact matches
   - Boolean values should be `true`/`false` not `1`/`0`

3. **Queries:** The database wrapper automatically converts:
   - `?` placeholders → `$1`, `$2` etc
   - Table names: `Patient` → `patient`
   - Column names: `patient_id` → `patient_id`

4. **Stored Procedures:** Not directly supported yet
   - Current implementation has placeholders
   - Will need to convert to PostgreSQL functions if needed

---

## 🚀 Production Deployment

When ready to deploy:

1. **Backup Supabase data**
   ```bash
   # Use Supabase backup feature in project settings
   ```

2. **Set production environment variables**
   - Update `.env` with production Supabase credentials
   - Or use CI/CD secrets management

3. **Test with production data**
   - Run full test suite
   - Verify all API endpoints work

4. **Deploy to hosting**
   - Docker: Build image with new code
   - Heroku/Railway: Push code
   - Manually: SSH and pull updates

---

## 📞 Support Resources

- **Supabase Docs:** https://supabase.com/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Node.js Best Practices:** https://nodejs.org/en/docs/guides/

---

## 🎯 Summary

Your ClinicPro backend is now ready for Supabase!

**What was done:**
1. ✅ Migrated from MySQL to PostgreSQL (Supabase)
2. ✅ Removed MySQL dependencies
3. ✅ Created automatic query conversion layer
4. ✅ Set up environment configuration
5. ✅ Tested connection successfully

**What you need to do:**
1. 🔴 **CREATE DATABASE SCHEMA** (run SQL in Supabase)
2. 🟡 Migrate existing data (optional)
3. 🟢 Test API endpoints
4. 🟢 Deploy to production

**Current Status:**
- Backend: ✓ Ready
- Database: ⏳ Awaiting schema creation
- Frontend: ✓ No changes needed

---

**Questions?** Check `SUPABASE_MIGRATION_GUIDE.md` for more details.
