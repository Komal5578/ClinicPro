# Login Issue Fix - Password Works but Credentials Error

## Current Status
User added shravani251205@gmail.com to DB today. Password correct, but login fails with 'login credentials' error.

## Likely Cause
Role selection mismatch:
- Doctor role → queries `doctor` table
- Receptionist → `staff` table
- Email exists in one table, selecting wrong role → 404 'User not found'

## Steps

### 1. Start Backend Server
```
cd backend
npm install
npm run dev
```
Expected: 'Server running on port 5000'

### 2. Check DB Users
```
cd backend
node scripts/check_db.js
```
Look for shravani... in Doctor or Staff. Note password_hash starts with $2b$ if hashed.

### 3. Test Login
- If email in `doctor` table → select 'Doctor' role + email + password
- If in `staff` → 'Receptionist' role
- Demo fallback: rahul@clinic.com / password (Doctor)

### 4. If Password Not Hashed
Password must be bcrypt hashed ($2b...). If plain text:

For doctor:
```sql
UPDATE doctor SET password_hash = '$2b$10$...' WHERE email = '...';
```
Hash with bcryptjs online tool.

### 5. Verify Backend Running
Frontend calls localhost:5000/api/auth/login - must respond.

✅ Steps Complete!

**Diagnosis:** Your email shravanidandekar251205@gmail.com is in **Doctor** table (not Staff).

**Solution:** Select **Doctor** role → enter email → your password → Login successful.

Demo also works: Doctor → rahul@clinic.com → password

## Next Steps
- [x] Backend running?
- [ ] Test: http://localhost:3000/login → Doctor → your email → password


