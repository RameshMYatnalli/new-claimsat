# ClaimSat + Reunify

**A unified disaster response platform: damage verification (ClaimSat) and family reunification (Reunify).**

Built with **React**, **FastAPI**, and **MongoDB** for real-world disaster response—configurable, documented, and production-oriented.

---

## Overview

ClaimSat + Reunify combines two core capabilities in one system:

- **ClaimSat** — File and verify damage claims with automated scoring, evidence upload, and admin review.
- **Reunify** — Report missing persons and survivors, run fuzzy matching, and support authority-led reunification.

---

## Key Features

### ClaimSat (Damage verification)

- File new claims with disaster, location (map), date, property type, description, and evidence (images/video).
- Automated scoring: location match, time proximity, evidence type, visual relevance, metadata integrity.
- Status flow: **Pending** → **Needs review** → **Pre-approved** / **Rejected** with clear labels.
- Claim dashboard with filters; claim detail view with score breakdown and map.
- Admin dashboard: list claims, view score and details, **Approve** or **Reject**; status syncs to ClaimSat.

### Reunify (Missing persons & survivors)

- Report missing person or survivor (name, age, gender, location, physical description, disaster).
- Fuzzy matching: name similarity (Levenshtein), age band, gender, location proximity, description.
- Confidence score and explanation per match; authority verification workflow.
- Dashboards for missing persons, survivors, and matches; match detail view.

### Platform

- Single app: **Home**, **ClaimSat**, **Reunify**, **Admin**.
- Responsive UI; API-first backend with OpenAPI docs at `/docs`, health check, CORS for frontend.

---

## Tech Stack

| Layer      | Stack |
|-----------|--------|
| **Frontend** | React 19, TypeScript, Vite 7, Tailwind CSS v4, React Router v7, Leaflet/react-leaflet |
| **Backend**  | Python, FastAPI, Uvicorn, Motor (async MongoDB), Pydantic |
| **Data**     | MongoDB (async), indexes for IDs, status, timestamps, 2dsphere (geo) |

### Backend APIs

- **`/api/claims`** — CRUD, evidence upload, scoring.
- **`/api/reunify`** — Missing persons, survivors, matches.

### Backend services

- Claim scoring, evidence analysis (OpenCV/Pillow/Shapely), reunify matching (Levenshtein, geopy).

---

## Project structure

```
new claimsat/
├── README.md
├── PPT_CONTENT_ClaimSat_Reunify.md   # Slide content & architecture
├── claimsat-reunify/                 # Frontend (React SPA)
│   ├── src/
│   │   ├── pages/                    # ClaimSat, Reunify, Admin
│   │   ├── components/
│   │   └── services/
│   ├── package.json
│   └── vite.config.ts
└── backend/                          # FastAPI backend
    ├── main.py
    ├── core/                         # config, database
    ├── models/                       # Pydantic models
    ├── routes/                       # claims, reunify
    ├── services/                     # scoring, evidence, matching
    ├── requirements.txt
    └── .env.example (optional)
```

---

## Getting started

### Prerequisites

- **Node.js** 18+ (for frontend)
- **Python** 3.10+ (for backend)
- **MongoDB** (local or Atlas)

### Backend

1. Create a virtual environment and install dependencies:

   ```bash
   cd backend
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # macOS/Linux
   # source venv/bin/activate
   pip install -r requirements.txt
   ```

2. Configure environment (e.g. copy `.env.example` to `.env` and set `MONGODB_URI`).

3. Run the API:

   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

   - API: `http://localhost:8000`
   - OpenAPI docs: `http://localhost:8000/docs`

### Frontend

1. Install dependencies and run the dev server:

   ```bash
   cd claimsat-reunify
   npm install
   npm run dev
   ```

2. Open the app at `http://localhost:5173` (or the port shown by Vite).

3. Optional: set API base URL via env (e.g. `VITE_API_BASE_URL=http://localhost:8000`) so the frontend talks to the backend.

### Build for production

- **Frontend:** `npm run build` (output in `claimsat-reunify/dist`).
- **Backend:** run with `uvicorn main:app --host 0.0.0.0 --port 8000` (no `--reload` in production).

---

## Data integrity

- Single source: claims, evidence, and reunify data in MongoDB with Pydantic-backed schemas.
- Indexes: unique IDs, status, timestamps, 2dsphere for geo queries.
- Validation: Pydantic on request/response; file type and size limits for uploads.
- Audit: claim events (created, evidence_added, scored, status_changed).
- Explainability: every score has a breakdown (location, time, evidence, visual, metadata) and text explanation.

---

## Impacts and benefits

- **Faster verification** — Automated multi-factor scoring and instant feedback (pending / needs review / approved / rejected).
- **Transparency** — Explainable confidence scores and breakdowns for trust and appeals.
- **Fraud reduction** — Geo-temporal and evidence checks to flag inconsistent claims.
- **Authority-first** — System recommends; final approve/reject stays with admin.
- **Reunification** — Fuzzy matching surfaces likely matches; verification before reuniting.
- **Scalability** — Async backend and indexed MongoDB; frontend deployable on CDN.

---

## Future scope

- Full backend integration (submit claims, evidence upload, fetch lists; phase out local-only storage).
- Auth & roles: JWT login, role-based access (claimant, field officer, admin), audit logs.
- ML/CV: damage detection and severity from images/video; improved name/face matching for Reunify.
- Notifications: email/SMS on claim status change and high-confidence reunify matches.
- Multi-disaster & reporting: filters by disaster, region, time; dashboards and reports.
- Mobile: PWA or native app for evidence capture and reporting in low-connectivity areas.

---

## License

Proprietary / project-specific. See your organization’s terms.

---

*ClaimSat + Reunify: A unified disaster response platform with damage verification (ClaimSat) and family reunification (Reunify).*
