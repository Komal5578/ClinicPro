# Supabase Migration Guide

## Setup Instructions

### 1. Create Tables in Supabase Dashboard

Go to your Supabase project: https://zbnoagxioabwcrabiyjt.supabase.co/

1. Navigate to **SQL Editor**
2. Click **New Query**
3. Paste the content from `database/schema/supabase_schema.sql`
4. Click **Run**

This will create all the necessary tables and ENUM types in your PostgreSQL database.

---

## Environment Variables

Your `.env` file has been updated with:

```
SUPABASE_URL=https://zbnoagxioabwcrabiyjt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpibm9hZ3hpb2Fid2NyYWJpeWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NjQzNzYsImV4cCI6MjA5MzA0MDM3Nn0.66JLmNVJod4GMrDivng9X4cg68ApcqRKPK2NDexuUtE
```

**Keep these credentials secure and never commit them to version control.**

---

## Code Changes

### Database Connection

The database connection has been migrated from MySQL to Supabase (PostgreSQL).

**Old setup:** `mysql2` NPM package with MySQL
**New setup:** `@supabase/supabase-js` NPM package with PostgreSQL

**Files changed:**
- `backend/package.json` - Updated dependencies
- `backend/src/config/db.js` - Now uses Supabase client
- `backend/src/config/env.js` - Added Supabase config
- `backend/src/config/supabase.js` - New Supabase client initialization

### Key Differences

#### 1. **Table Names**
MySQL used PascalCase: `Patient`, `Doctor`, `Clinic`
PostgreSQL uses snake_case: `patient`, `doctor`, `clinic`

The database wrapper automatically converts this, but be aware:
- `Patient` → `patient`
- `Doctor` → `doctor`
- `Clinic` → `clinic`
- `DoctorClinic` → `doctor_clinic`
- etc.

#### 2. **Auto-increment IDs**
MySQL: `AUTO_INCREMENT`
PostgreSQL: `BIGSERIAL` (auto-incrementing bigint)

The IDs are returned as before in the `insertId` field.

#### 3. **Data Types**
| MySQL | PostgreSQL |
|-------|-----------|
| `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | `TIMESTAMP DEFAULT NOW()` |
| `TINYINT(1)` | `BOOLEAN` |
| `INT AUTO_INCREMENT PRIMARY KEY` | `BIGSERIAL PRIMARY KEY` |

#### 4. **ENUM Types**
MySQL uses inline ENUM definitions. PostgreSQL uses separate type definitions. New ENUMs are created as:
- `clinic_sector` (GENERAL, AYURVEDIC, DENTAL)
- `appointment_status` (SCHEDULED, ARRIVED, COMPLETE, CANCELLED, RESCHEDULED)
- `walkin_priority` (REGULAR, PRIORITY, URGENT)
- And more...

---

## Migrating Data from Old Database

If you have existing data in your MySQL database, follow these steps:

### 1. Export MySQL Data
```bash
mysqldump -h [host] -u [user] -p[password] clinic_db > backup.sql
```

### 2. Transform and Import

Create a script to:
1. Export data from MySQL
2. Transform table names to snake_case
3. Convert data types as needed
4. Import into Supabase PostgreSQL

Example transformation:
- Change column references from `Patient.patient_id` to `patient.patient_id`
- Ensure boolean values are properly formatted
- Handle ENUM value conversions if needed

### 3. Using Supabase Data Import

Alternatively, use Supabase's built-in data import:
1. Go to **SQL Editor** in Supabase dashboard
2. Select **Import** option
3. Upload your CSV/SQL file
4. Map columns to the correct tables

---

## Testing the Connection

Run the backend server:

```bash
cd backend
npm start
```

You should see:
```
✓ Supabase connected successfully
```

---

## Query Compatibility

The database wrapper in `backend/src/config/db.js` automatically handles:
- Parameter conversion (`?` placeholders to `$1, $2`, etc.)
- Table and column name normalization (PascalCase to snake_case)
- Basic SELECT, INSERT, UPDATE, DELETE operations

### Supported Query Patterns

✅ **Supported:**
```javascript
const [rows] = await db.query('SELECT * FROM Patient WHERE phone = ?', [phone]);
const [result] = await db.query('INSERT INTO Patient (name, phone) VALUES (?, ?)', [name, phone]);
const [result] = await db.query('UPDATE Doctor SET specialization = ? WHERE doctor_id = ?', [spec, id]);
const [result] = await db.query('DELETE FROM Patient WHERE patient_id = ?', [id]);
```

⚠️ **Limitations:**
- Complex JOINs may need restructuring
- Stored procedures (CALL statements) are not directly supported
- Aggregate functions need special handling
- Transaction support differs slightly

---

## Next Steps

1. ✅ Install dependencies (`npm install`)
2. ✅ Configure Supabase credentials
3. **Create tables in Supabase** (Copy schema SQL to Supabase SQL Editor)
4. **Test connection** (Run `npm start`)
5. **Migrate existing data** (If needed)
6. **Test all API endpoints** (Ensure all CRUD operations work)
7. **Deploy to production** (When verified)

---

## Troubleshooting

### "Supabase connection failed"
- Check `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`
- Ensure they match your Supabase project credentials
- Verify `.env` file exists in `backend/` directory

### "Table not found" errors
- Confirm you ran the schema SQL in Supabase SQL Editor
- Check table names are in snake_case in queries
- Verify the table was created successfully in Supabase

### "Foreign key constraint violation"
- When inserting/updating data, ensure referenced rows exist
- PostgreSQL enforces foreign keys strictly
- Check the order of insertions if importing data

### Stored Procedures Not Working
- Stored procedures from MySQL won't work directly
- Convert them to PostgreSQL functions or handle in application code
- We'll implement this as needed

---

## Support

For Supabase documentation: https://supabase.com/docs
For PostgreSQL reference: https://www.postgresql.org/docs/
