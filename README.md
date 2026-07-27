# JBLCF-B — Attendance Management System

A QR-code-based student attendance system built for JBLCF. Professors scan student QR codes to record attendance in real time. Admins manage students, classes, users, and class rosters. The system consists of a **Go REST API** backend and a **React + Vite** frontend.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 8, Tailwind CSS v3 |
| Animations | Anime.js v4 |
| Backend | Go 1.25+, `net/http` (no framework) |
| Database | MySQL 8 (via XAMPP) |
| Auth | JWT (HS256, 24-hour expiry) |
| QR Scanning | `html5-qrcode` |
| QR Generation | `qrcode.react` |
| Photo Capture | `navigator.mediaDevices.getUserMedia` |

---

## Prerequisites

- [Go 1.25+](https://go.dev/dl/)
- [Node.js 20+ LTS](https://nodejs.org/)
- [XAMPP](https://www.apachefriends.org/) (for MySQL; Apache is not required)

---

## Setup

### 1. Clone / Download the project

```bash
cd c:\xampp\htdocs
# place the JBLCF-B folder here
```

### 2. Configure environment variables

```bash
# Copy the example file
copy .env.example .env
```

Open `.env` and fill in your values:

```env
SERVER_PORT=8080
DB_HOST=127.0.0.1:3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=jblcf_attendance

# REQUIRED: Generate a strong secret — the server refuses to start without one.
# Run: openssl rand -hex 32
JWT_SECRET=your_64_char_random_hex_here
```

> **`JWT_SECRET` is mandatory.** The server will `log.Fatal` and refuse to start if it is blank or is still the placeholder value `CHANGE_ME_use_openssl_rand_hex_32`.

### 3. Create the database and run migrations

Start MySQL from XAMPP, then run each migration file **in order**:

```bash
# Windows (XAMPP)
C:\xampp\mysql\bin\mysql.exe -u root < migrations/0001_initial_schema.sql
C:\xampp\mysql\bin\mysql.exe -u root < migrations/0002_attendance_unique_constraint.sql
C:\xampp\mysql\bin\mysql.exe -u root < migrations/0003_class_enrollments.sql

# Mac/Linux
mysql -u root -p < migrations/0001_initial_schema.sql
mysql -u root -p < migrations/0002_attendance_unique_constraint.sql
mysql -u root -p < migrations/0003_class_enrollments.sql
```

The schema creates these tables: `users`, `courses`, `students`, `classes`, `class_enrollments`, `attendance_records`.

### 4. Create the uploads directory

```bash
mkdir uploads
```

### 5. Install frontend dependencies

```bash
npm install
```

### 6. Install backend dependencies

```bash
go mod download
```

---

## Running Locally

### Backend (Go API)

```bash
# From the project root
go build -buildvcs=false -o server.exe ./cmd/server/
.\server.exe
```

The server starts on the port specified in `.env` (default `8080`).
Health check: `http://localhost:8080/health`

### Frontend (Vite dev server with HTTPS)

```bash
npm run dev
```

The frontend starts on `https://localhost:5173` (HTTPS is required for camera access on mobile).

> ⚠️ Your browser will show a self-signed certificate warning. Click **Advanced → Proceed** — this is expected in dev.

> The Vite dev server proxies `/api/` and `/uploads/` requests to `http://localhost:8080` automatically. If your backend is running elsewhere, set `VITE_API_BASE_URL` in the frontend environment to point at that host instead.

---

## `.env.example` variable reference

| Variable | Description | Example |
|---|---|---|
| `SERVER_PORT` | Port the Go server listens on | `8080` |
| `DB_HOST` | MySQL host and port | `127.0.0.1:3306` |
| `DB_USER` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | *(blank for XAMPP default)* |
| `DB_NAME` | MySQL database name | `jblcf_attendance` |
| `JWT_SECRET` | **Required.** 32+ char random string for JWT signing | *(generate with `openssl rand -hex 32`)* |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed origins | `https://localhost:5173` *(must use https)* |
| `VITE_API_BASE_URL` | Optional frontend API base URL for non-local backends | `http://your-api-host:8080` |

---

## Default Roles

| Role | Access |
|---|---|
| `superadmin` | Full system access: students, classes, courses, users, reports |
| `professor` | Own classes only: scan QR, view/approve attendance, view class roster |

Seed a superadmin account by inserting directly into the `users` table with a bcrypt-hashed password (cost 12).

---

## API Overview

### Auth (Public)
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login, returns JWT |

### Admin (`superadmin` role required)
| Method | Path | Description |
|---|---|---|
| `GET/POST` | `/api/admin/students` | List / create students |
| `GET/PUT/DELETE` | `/api/admin/students/:id` | Get / update / soft-delete student |
| `POST` | `/api/admin/students/:id/photo` | Upload student photo |
| `GET/POST` | `/api/admin/classes` | List / create classes |
| `PUT/DELETE` | `/api/admin/classes/:id` | Update / delete class |
| `GET/POST` | `/api/admin/classes/:id/enrollments` | List / add enrolled students |
| `DELETE` | `/api/admin/classes/:id/enrollments/:student_id` | Remove student from class |
| `GET/POST` | `/api/admin/courses` | List / create courses |
| `PUT` | `/api/admin/courses/:id` | Update course |
| `GET/POST` | `/api/admin/users` | List / create users |
| `PUT/DELETE` | `/api/admin/users/:id` | Update / deactivate user |
| `GET` | `/api/admin/stats` | Dashboard statistics |
| `GET` | `/api/admin/reports/class` | Class attendance report |
| `GET` | `/api/admin/reports/student` | Student attendance report |

### Professor (`professor` role required)
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/prof/classes` | Own classes |
| `GET` | `/api/prof/classes/:id/roster?date=YYYY-MM-DD` | Class roster with today's attendance |
| `POST` | `/api/prof/attendance/scan` | Look up student by QR token |
| `POST` | `/api/prof/attendance/approve` | Mark student present |
| `GET` | `/api/prof/attendance/class/:id` | All attendance records for a class |

---

## Security Notes

- All passwords hashed with **bcrypt cost 12**
- JWTs validated with **algorithm pinning** (`HS256` only — rejects `alg:none` attacks)
- Login endpoint protected by **dual rate limiter** (5 attempts / 15 min per IP and per email)
- All professor endpoints verify **class ownership** before returning data (IDOR prevention)
- Student soft-deletes **rename the unique fields** (`school_id`, `email`) with a timestamp suffix so IDs can be reused without UNIQUE constraint conflicts
- Uploaded files validated by **magic byte check** (JPEG/PNG only, ≤10 MB)

---

## Project Structure

```
JBLCF-B/
├── cmd/server/          # main.go — server entrypoint
├── internal/
│   ├── config/          # Env variable loader
│   ├── controllers/     # HTTP handler functions (MVC "C")
│   ├── db/              # Database connection
│   ├── middleware/       # Auth (JWT) + rate limiting
│   ├── models/          # Shared Go structs
│   ├── routes/          # Route registration
│   ├── utils/           # JWT generation, bcrypt, validator
│   └── views/           # Request/response DTOs
├── src/                 # React frontend (Vite)
│   ├── api/             # fetchApi client
│   ├── components/      # Reusable UI components
│   ├── controllers/     # React "controller" hooks (useXxxController)
│   ├── models/          # Frontend constants/types
│   └── views/           # Page-level React components
│       ├── professor/
│       └── superadmin/
├── uploads/             # Uploaded student photos (git-ignored)
├── .env                 # Local secrets (git-ignored)
├── .env.example         # Template — safe to commit
├── .gitignore
└── vite.config.js
```

---

## Out-of-Scope Future Enhancements (PRD §6)

The following items are **explicitly deferred** and were NOT built in this release. They are documented here so they are not silently dropped.

| Feature | PRD Reference | Status |
|---|---|---|
| **Student Self-Service Portal** | PRD §6.1 | ❌ Deferred — Students currently have no login. A student-facing portal (view own attendance, download QR pass) was out of scope for this build. |
| **Analytics Dashboard** | PRD §6.2 | ❌ Deferred — A visual analytics dashboard with charts (attendance trends, class comparison, per-student performance graphs) was not built. The current Reports page returns raw tabular data only. |
| **Push Notifications / Alerts** | PRD §6.3 | ❌ Deferred — Email or SMS notifications (e.g., alert parents/students when absent) were not implemented. No notification infrastructure (SMTP, SMS gateway) is present. |
| **Biometric / Facial Recognition** | PRD §6.4 | ❌ Deferred — The `FacialCapture` component captures and stores a photo for the student ID card only. It does NOT perform facial recognition or use it as an attendance verification method. |
| **Offline Mode / PWA** | PRD §6.5 | ❌ Deferred — The system requires an active network connection. No service worker, IndexedDB sync, or offline queue was implemented. |
| **Multi-Tenant / Multi-School** | PRD §6.6 | ❌ Deferred — The schema and codebase are scoped to a single institution. Multi-tenancy (separate school accounts) is not supported. |
