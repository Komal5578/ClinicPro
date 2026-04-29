# ClinicPro

ClinicPro is a full-stack clinic management app with:
- Doctor and clinic registration
- GST verification (demo and real modes)
- OPD workflows (appointments, walk-ins, consultation, prescriptions)
- Supabase-backed database and storage
- React + Vite frontend

## Tech Stack
- Backend: Node.js, Express
- Frontend: React, Vite
- Database: Supabase (PostgreSQL)
- Storage: Supabase Storage (doctor certificate/signature uploads)

## Project Structure
- `backend/` API server
- `frontend/` React app
- `database/schema/` SQL schema files

## Prerequisites
- Node.js 18+
- npm
- Supabase project

## Environment Setup
Create `backend/.env` with at least:

```env
PORT=5000
JWT_SECRET=your_jwt_secret

SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_JWT_SECRET=<jwt-secret-optional>

# For direct SQL scripts (optional)
DATABASE_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres

# GST verification mode: demo or real
GST_MODE=demo
GST_API_KEY=<required-only-for-real-mode>
GST_API_HOST=<required-only-for-real-mode>
```

Frontend env (`frontend/.env`) example:

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

## Database Setup (Supabase)
If your schema is not created yet, use one of these files in Supabase SQL Editor:

- Clean setup: `database/schema/supabase_schema.sql`
- Rebuild from partial/broken state: `database/schema/supabase_schema_rebuild.sql`

After applying schema, you should see tables like `doctor`, `clinic`, `doctor_clinic`, `patient`, `appointment`, `reminder`, etc.

## Run Locally
Install dependencies:

```powershell
cd backend
npm install
cd ../frontend
npm install
```

Start backend:

```powershell
cd backend
npm run dev
```

Start frontend:

```powershell
cd frontend
npm run dev
```

Build frontend:

```powershell
cd frontend
npm run build
```

## GST Verification Modes
Clinic registration supports two modes:

1. Demo GST mode
- Uses hardcoded fake GST numbers
- Intended for presentation/demo only

2. Real GST mode
- Calls real GST verification API
- Requires valid `GST_API_KEY` and `GST_API_HOST`

Demo GST numbers currently available:
- `27ABCDE1234F1Z5`
- `29ABCDE1234F1Z5`
- `07ABCDE1234F1Z5`
- `33ABCDE1234F1Z5`
- `24ABCDE1234F1Z5`
- `19ABCDE1234F1Z5`
- `06ABCDE1234F1Z5`
- `09ABCDE1234F1Z5`
- `22ABCDE1234F1Z5`
- `08ABCDE1234F1Z5`

## File Uploads
Doctor registration supports:
- Certificate upload
- Signature upload

Files are uploaded to Supabase Storage buckets (auto-created on first upload):
- `doctor-certificates`
- `doctor-signatures`

Stored URLs are saved in `doctor.certificate_url` and `doctor.digital_signature_path`.

## Notes
- Keep `.env` files out of git.
- Use demo GST mode only for demos/PPT.
- Use real GST mode in production environments.
