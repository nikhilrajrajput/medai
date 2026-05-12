# MedAI — Gemini Powered Medical Platform

<div align="center">

![MedAI Banner](<img width="1908" height="889" alt="image" src="https://github.com/user-attachments/assets/92b60b4d-8beb-4d3e-a2e9-feedd0307d67" />
)

[![Node.js]<img width="1898" height="881" alt="image" src="https://github.com/user-attachments/assets/ca203f21-6fda-47a3-8675-c94e88c0492f" />
](https://nodejs.org)
[![Express](<img width="1034" height="840" alt="image" src="https://github.com/user-attachments/assets/50b1d471-54ad-4b96-9c9a-d63ccbd4a179" />
)](https://expressjs.com)
[![React](<img width="1912" height="892" alt="image" src="https://github.com/user-attachments/assets/867d7735-aa2a-4fdf-a7d2-ec6fa2927a91" />
)](https://react.dev)
[![MongoDB](<img width="1875" height="743" alt="image" src="https://github.com/user-attachments/assets/d53b832b-8d6e-43da-af41-fb3f2c8c8fe8" />
)](https://mongodb.com)
[![Supabase](<img width="1895" height="905" alt="image" src="https://github.com/user-attachments/assets/25bbe2a8-0acd-4683-b4cb-f569c56a79c9" />
)](https://supabase.com)

**AI-powered medication insights and medical report analysis — secured with JWT + Supabase OTP email verification.**

[Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [API Reference](#-api-reference) · [Deployment](#-deployment)

</div>

---

## ⚠️ Disclaimer

> This platform provides AI-generated information **for educational purposes only**. It is **not** a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional.

---

## ✨ Features

### 🔐 Authentication
- User registration with **Supabase OTP email verification** (6-digit code sent to inbox)
- Secure login with **JWT access tokens** (7 day) + **refresh tokens** (30 day)
- Auto token refresh on expiry via Axios interceptors
- Password strength meter on registration
- Protected routes — unauthenticated users redirected to login

### 💊 Medication Information
- Search any medication by name
- **Gemini AI** returns structured clinical data:
  - Dosage, quantity, frequency, timing
  - Method of administration
  - Indications, contraindications
  - Common & serious side effects
  - Drug interactions & precautions
  - Storage instructions, pregnancy category, overdose info
  - Diet suggestions & summary
- Quick-search pills for common medications

### 🧬 Medical Report Analysis
- Drag-and-drop file upload (JPEG, PNG, WEBP, PDF — up to 15MB)
- **Gemini Vision AI** analyzes reports and returns:
  - Clinical summary & key findings
  - Abnormal values table with flags (HIGH/LOW)
  - Possible diagnoses
  - Recommended imaging (MRI, CT scans)
  - Surgical interventions (if needed)
  - Suggested medications with reasons
  - Specialist referrals & lifestyle advice
  - Urgency level: `routine | soon | urgent | emergency`
  - Follow-up plan

### 📋 Search History
- All medication searches and report analyses saved per user
- Filter by type (medication / report)
- Click any history item to view full results
- Delete individual records or clear all history

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express v5** | REST API server |
| **MongoDB + Mongoose v9** | Database — user profiles, search history |
| **Supabase Auth** | OTP email verification (no SMTP needed) |
| **JSON Web Tokens** | API authentication (access + refresh tokens) |
| **Google Gemini AI** | Medication info + medical report vision analysis |
| **Multer** | Multipart file upload handling |
| **Helmet + CORS** | Security headers |
| **express-rate-limit** | Brute-force protection |
| **Joi** | Request body validation |
| **Bcryptjs** | Password hashing (12 salt rounds) |

### Frontend
| Technology | Purpose |
|---|---|
| **React v19 + Vite** | UI framework & build tool |
| **Tailwind CSS v4** | Utility-first styling |
| **React Router v7** | Client-side routing |
| **Axios** | HTTP client with JWT interceptors |
| **react-hot-toast** | Toast notifications |
| **lucide-react** | Icon library |

---

## 📁 Project Structure

```
medai/
├── backend/
│   ├── config/
│   │   ├── database.js          # MongoDB connection
│   │   ├── gemini.js            # Gemini AI text + vision helpers
│   │   └── supabase.js          # Supabase admin client
│   ├── middleware/
│   │   ├── auth.js              # JWT protect middleware
│   │   ├── validation.js        # Joi request validation
│   │   └── errorHandler.js      # Global error handler
│   ├── models/
│   │   ├── User.js              # User schema (bcrypt, OTP fields)
│   │   └── SearchHistory.js     # Search/report history schema
│   ├── routes/
│   │   ├── auth.js              # Register, verify OTP, login, refresh, me, logout
│   │   ├── medication.js        # Gemini medication search + history
│   │   ├── report.js            # Gemini report analysis + history
│   │   └── history.js           # Combined history CRUD
│   ├── .env.example             # Environment variable template
│   ├── package.json
│   └── index.js                 # Express entry point
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx        # Top nav with user dropdown
    │   │   └── ProtectedRoute.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx   # Global auth state + token management
    │   ├── pages/
    │   │   ├── LoginPage.jsx     # Split-panel login
    │   │   ├── RegisterPage.jsx  # Registration + OTP verification step
    │   │   ├── MedicationPage.jsx
    │   │   ├── ReportPage.jsx
    │   │   └── HistoryPage.jsx
    │   ├── utils/
    │   │   └── api.js            # Axios instance + JWT auto-refresh
    │   ├── App.jsx               # Routes + public/private guards
    │   ├── main.jsx
    │   └── index.css             # Dark medical theme + Tailwind
    ├── index.html
    ├── vite.config.js            # Vite + /api proxy to backend
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **MongoDB** (local) or [MongoDB Atlas](https://cloud.mongodb.com) (free tier)
- **Google Gemini API key** — [Get one here](https://aistudio.google.com/app/apikey)
- **Supabase project** — [Create one here](https://supabase.com) (free tier)

---

### 1. Clone the repository

```bash
git clone https://github.com/your-username/medai.git
cd medai
```

---

### 2. Set up Supabase (for OTP email verification)

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **Authentication → Providers → Email**:
   - Turn **OFF** "Confirm email" (sends magic link — not wanted)
   - Turn **ON** "Enable Email OTP"
   - Set OTP expiry to `600` seconds
3. Go to **Authentication → Email Templates → Confirm signup** and paste this into the body:

```html
<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f9f9f9">
  <div style="background:#0d1a16;border-radius:12px;padding:32px;text-align:center">
    <h1 style="color:#e8f5ef;font-size:24px;margin:0 0 8px">Med<span style="color:#22c55e">AI</span></h1>
    <p style="color:#8aad9b;margin:0 0 24px">Your email verification code</p>
    <div style="background:#112218;border:2px solid #264d37;border-radius:12px;padding:24px;margin-bottom:24px">
      <p style="color:#4d7a61;font-size:11px;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px">Verification Code</p>
      <h2 style="color:#22c55e;font-size:40px;letter-spacing:10px;margin:0;font-family:monospace">{{ .Token }}</h2>
    </div>
    <p style="color:#4d7a61;font-size:12px;margin:0">This code expires in 10 minutes. Do not share it.</p>
  </div>
</div>
```

4. Go to **Authentication → URL Configuration** → set Site URL to your production frontend URL
5. Go to **Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** secret key → `SUPABASE_SERVICE_ROLE_KEY`

---

### 3. Configure backend environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/medai
# Or Atlas: mongodb+srv://user:pass@cluster.mongodb.net/medai

# JWT
JWT_SECRET=your_long_random_secret_min_32_chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=another_long_random_secret_min_32_chars
JWT_REFRESH_EXPIRES_IN=30d

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...your_service_role_key
```

---

### 4. Install dependencies & run

**Backend:**
```bash
cd backend
npm install
npm run dev        # runs on http://localhost:5000
```

**Frontend** (new terminal):
```bash
cd frontend
npm install
npm run dev        # runs on http://localhost:3000
```

The Vite dev server proxies all `/api/*` requests to `http://localhost:5000` automatically.

---

## 📡 API Reference

### Base URL
```
http://localhost:5000/api
```

### Auth Routes `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | ❌ | Create account — triggers Supabase OTP email |
| `POST` | `/verify-otp` | ❌ | Verify 6-digit OTP — returns JWT tokens |
| `POST` | `/resend-otp` | ❌ | Resend OTP to email |
| `POST` | `/login` | ❌ | Login with email + password |
| `POST` | `/refresh` | ❌ | Refresh access token |
| `GET` | `/me` | ✅ | Get current user profile |
| `POST` | `/logout` | ✅ | Logout |

**Register request body:**
```json
{
  "name": "Dr. Jane Smith",
  "email": "jane@hospital.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

**Verify OTP request body:**
```json
{
  "email": "jane@hospital.com",
  "otp": "482917"
}
```

---

### Medication Routes `/api/medication`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/search` | ✅ | Search medication via Gemini AI |
| `GET` | `/history` | ✅ | Get medication search history |

**Search request body:**
```json
{
  "medicationName": "Metformin"
}
```

---

### Report Routes `/api/report`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/analyze` | ✅ | Upload + analyze report (multipart/form-data) |
| `GET` | `/history` | ✅ | Get report analysis history |

**File upload:** `form-data` with field name `report` — accepts JPEG, PNG, WEBP, PDF (max 15MB)

---

### History Routes `/api/history`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | ✅ | Get all history (query: `?type=medication\|report&limit=30`) |
| `DELETE` | `/:id` | ✅ | Delete single record |
| `DELETE` | `/` | ✅ | Clear all history |

---

### Health Check

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Check API is running |

---

## 🔐 Authentication Flow

```
Register → Supabase sends OTP email
    ↓
User enters 6-digit code
    ↓
Backend verifies OTP with Supabase
    ↓
MongoDB user marked as verified
    ↓
JWT access token (7d) + refresh token (30d) issued
    ↓
All API requests: Authorization: Bearer <accessToken>
    ↓
On 401 → Axios auto-calls /auth/refresh silently
    ↓
On refresh failure → redirect to /login
```

---

## ☁️ Deployment

### Backend — Render

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repository
3. Set build command: `npm install`
4. Set start command: `node index.js`
5. Add all environment variables from `.env.example` in the **Environment** tab

> **Important:** Do NOT use `nodemon` as the start command in production.

### Frontend — Vercel / Netlify

1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variable:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```
5. Update `vite.config.js` proxy target to your deployed backend URL

### MongoDB Atlas

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a database user
3. Whitelist `0.0.0.0/0` in Network Access (or your server's IP)
4. Copy the connection string to `MONGODB_URI`

---

## 🔑 Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `PORT` | ✅ | Server port (default: 5000) |
| `NODE_ENV` | ✅ | `development` or `production` |
| `FRONTEND_URL` | ✅ | Frontend URL for CORS |
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Access token secret (min 32 chars) |
| `JWT_EXPIRES_IN` | ✅ | Access token expiry (e.g. `7d`) |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token secret (min 32 chars) |
| `JWT_REFRESH_EXPIRES_IN` | ✅ | Refresh token expiry (e.g. `30d`) |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role secret key |

---

## 🧠 How Gemini AI is Used

### Medication Search
Uses `gemini-1.5-flash` text model with a structured JSON prompt. Returns a fully typed medication object with 14 clinical fields.

### Report Analysis
Uses `gemini-1.5-flash` vision/multimodal model. Accepts base64-encoded images and PDFs. Returns a structured analysis with findings, diagnoses, urgency level, and treatment recommendations.

Both use a `parseJSON()` helper that strips markdown fences from the response before parsing, making it robust against model formatting variations.

---

## 🛡️ Security

- Passwords hashed with **bcryptjs** (12 salt rounds)
- JWT secrets should be **minimum 32 random characters** in production
- **Rate limiting** on all routes (100 req/15min global, 20 req/15min on auth)
- **Helmet.js** sets secure HTTP headers
- **CORS** restricted to `FRONTEND_URL` only
- Supabase `service_role` key is **never sent to the frontend**
- OTP brute-force protection via Supabase (built-in)
- File uploads validated by MIME type (JPEG, PNG, WEBP, PDF only)

---

## 📦 Scripts

### Backend
```bash
npm run dev     # Start with nodemon (development)
npm start       # Start with node (production)
```

### Frontend
```bash
npm run dev     # Vite dev server on port 3000
npm run build   # Production build → dist/
npm run preview # Preview production build locally
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 👤 Author

**Nikhil Raj**

---

## 📄 License

This project is licensed under the **ISC License**.

---

<div align="center">

Made with ❤️ · For educational purposes only · Not a substitute for medical advice

</div>
