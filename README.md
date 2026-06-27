# ClinicPro 

An AI-powered clinic management system built for Indian healthcare. ClinicPro digitizes the entire clinic workflow — from patient walk-in to AI-generated prescriptions — across General, Ayurvedic, and Dental practices.

## Live Demo

- **Frontend:** [clinic-pro-ten.vercel.app](https://clinic-pro-ten.vercel.app)
- **Backend:** Deployed on Render

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Doctor | priya.iyer@clinic.com | 123456 |
| Receptionist | anjali@iyer.com | 123456 |
| Patient | Enter registered phone | OTP verified |

---

## Features

### 🩺 Doctor Portal
- **Real-time queue management** — see patients: WAITING → IN CONSULTATION → DONE with priority levels (Regular, Priority, Urgent)
- **Voice-to-text consultation notes** — dictate chief complaint and diagnosis hands-free
- **AI prescription autofill** — powered by Groq LLaMA 3.3, doctor speaks or types medicine names and AI auto-fills dosage, frequency, and duration
- **PDF prescription generation** — professional PDF with doctor signature, clinic name, specialization, and patient details
- **Tomorrow's slot setup** — configure morning/evening slots with custom durations and token counts
- **Analytics dashboard** — today's patient count, completion rate, urgent cases, walk-in vs appointment breakdown

### 🏥 Receptionist Portal
- **Walk-in registration** — 4-step flow: search by phone → register if new → set priority → add to queue
- **Appointment management** — view today's scheduled appointments and live walk-in queue side by side
- **Inventory management** — track medicines, consumables, and equipment with low stock alerts
- **Staff management** — add and manage clinic receptionists

### 👤 Patient Portal
- **Clinic discovery map** — interactive Leaflet map showing all clinics with color-coded markers by specialty (General, Ayurvedic, Dental)
- **Slot booking** — browse available slots by date and book appointments directly from the map
- **My Records** — OTP-verified access to full consultation history and downloadable prescription PDFs
- **Symptom guide chatbot** — helps patients identify the right specialist based on symptoms

### 💊 Medicine Check (AI-Powered)
Patients can look up any medicine in two ways:

**Type Name:**
- Enter any medicine name (brand or generic) — e.g. Dolo 650, Paracetamol, Amoxicillin
- Instantly get: what it is used for, common dosage, side effects, and whether a prescription is required

**Upload Photo / Scan Strip:**
- Take a photo of a medicine strip, box, or blister pack
- AI (Gemini Vision) reads the medicine name from the image
- Returns full analysis:
  - Medicine name and strength
  - What it is prescribed for
  - Usual dose and how many doses per day
  - Side effects to watch for
  - Warnings and contraindications
  - Confidence level of the scan
  - Whether prescription is required

> Disclaimer shown to users: For reference only. Always consult a doctor or pharmacist before taking any medicine.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL) |
| AI — Prescription | Groq API (LLaMA 3.3 70B) |
| AI — Medicine Scan | Google Gemini Vision API |
| Maps | Leaflet.js |
| PDF | PDFKit |
| Auth | JWT + bcrypt |
| OTP | Fast2SMS |
| Hosting | Vercel (frontend) + Render (backend) |

---

## Project Structure

```
clinicpro/
├── backend/
│   ├── src/
│   │   ├── config/          # Supabase, env config
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth, role middleware
│   │   ├── routes/          # API routes
│   │   ├── services/        # PDF, SMS, AI services
│   │   └── utils/           # JWT helpers
│   ├── generated/pdfs/      # Generated prescriptions
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # Auth context
│   │   ├── pages/           # Doctor, Receptionist, Patient pages
│   │   └── services/        # API service layer
│   └── index.html
└── database/
    └── schema/              # SQL schema files
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Groq API key — free at [console.groq.com](https://console.groq.com)
- Gemini API key — free at [aistudio.google.com](https://aistudio.google.com)

### Backend Setup

```bash
cd backend
npm install
```

Create `.env`:
```env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_key
GEMINI_API_KEY=your_gemini_key
FAST2SMS_API_KEY=your_fast2sms_key
```

```bash
node server.js
```

### Frontend Setup

```bash
cd frontend
npm install
```

Create `.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Doctor / Receptionist login |
| POST | `/api/auth/send-otp` | Send OTP to patient phone |
| POST | `/api/auth/verify-otp` | Verify OTP and return patient token |

### Walk-ins
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/walkins/today` | Get today's walk-in queue |
| POST | `/api/walkins/register` | Register new walk-in |
| PATCH | `/api/walkins/:id/status` | Update status (WAITING / IN_CONSULTATION / DONE) |

### Consultations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/consultations` | Save consultation notes |
| GET | `/api/consultations/patient/:id` | Get patient consultation history |

### Prescriptions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/prescriptions/draft` | Create or update draft prescription |
| POST | `/api/prescriptions/:id/finalize` | Finalize and generate PDF |
| POST | `/api/prescriptions/ai-autofill` | AI autofill from doctor dictation |

### Medicine
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/medicine/lookup` | Look up medicine by name |
| POST | `/api/medicine/ocr` | Scan medicine photo with Gemini Vision |

### Patients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/patients/search` | Search patient by phone |
| POST | `/api/patients/register` | Register new patient |

### Clinics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clinics/public` | Get all clinics for map |
| GET | `/api/clinics/doctor/:id` | Get clinics for a doctor |
| GET | `/api/slots/public` | Get available slots for a clinic |

---

## Key Workflows

### Walk-in Flow
```
Patient arrives
→ Receptionist searches by phone
→ Register if new patient
→ Add to queue with priority
→ Doctor sees queue in real time
→ Start consultation (voice notes)
→ AI autofills prescription
→ Finalize → PDF generated
→ Patient status → DONE
```

### Medicine Check Flow
```
Patient opens Medicine Check
→ Types medicine name OR uploads photo of strip
→ Gemini Vision reads strip (OCR)
→ AI returns: use, dosage, side effects, warnings
→ Patient sees full breakdown instantly
```

### Appointment Flow
```
Patient visits portal
→ Finds clinic on map (filtered by specialty)
→ Selects date and available slot
→ Enters name and phone
→ Appointment booked
→ Doctor sees it in appointments tab
```

---

## Database Schema

Core tables in Supabase (PostgreSQL):

| Table | Purpose |
|-------|---------|
| `doctor` | Doctor profiles and credentials |
| `clinic` | Clinic details, hours, GPS location |
| `doctor_clinic` | Many-to-many doctor ↔ clinic mapping |
| `staff` | Receptionist accounts |
| `patient` | Patient records |
| `walk_in` | Walk-in queue entries |
| `appointment` | Booked appointments |
| `slot` | Available time slots |
| `consultation` | Consultation notes and diagnosis |
| `prescription` | Prescription headers |
| `prescription_item` | Individual medicines per prescription |
| `otp_verification` | Patient OTP records |
| `inventory_item` | Clinic inventory tracking |

---


---

## License

MIT — feel free to use and adapt for your own clinic projects.