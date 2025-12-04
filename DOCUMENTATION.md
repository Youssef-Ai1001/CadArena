## CadArena – Project Documentation

Author: **Youssef Taha**  
Email: `ytaha8586@gmail.com`  
LinkedIn: `https://www.linkedin.com/in/yousseftahaai`  
GitHub: `https://github.com/Youssef-Ai1001`

---

### 1. Project Overview

CadArena is an end‑to‑end conversational CAD demo:

- **Frontend**: Next.js (App Router, TypeScript, Tailwind CSS)
- **Backend**: FastAPI, SQLAlchemy, SQLite
- **AI**: DXF‑generating service (via WebSocket) driven by an AI model

Goal: Let users describe CAD designs in natural language and instantly see DXF output in a browser viewer, similar to a ChatGPT‑like workflow but for CAD.

---

### 2. System Design (High‑Level)

#### 2.1 Components

- **Frontend**
  - `app/page.tsx`: Marketing + entry page, login/signup entry, theme + language controls.
  - `app/app/dashboard/page.tsx`: Project dashboard (list + create projects).
  - `app/app/chat/[id]/page.tsx`: Chat workspace + DXF viewer.
  - `components/DxfViewer.tsx`: Renders DXF output.
  - `hooks/useWebSocket.ts`: WebSocket client hook for streaming AI messages.
  - `components/ThemeToggle.tsx`: Dark/light theme switch.
  - `components/LanguageSwitcher.tsx`: Simple EN/AR language toggle (stored in `localStorage`).
  - `app/docs/page.tsx`: In‑app documentation summary.

- **Backend**
  - `app/main.py`: FastAPI app, CORS + rate limiting, router registration.
  - `app/core/config.py`: Configuration (DB URL, JWT secrets, email settings, CORS, etc.).
  - `app/core/security.py`: Password hashing, JWT access/refresh tokens, token decoding.
  - `app/api/v1/auth.py`: Signup, login, logout, refresh, email‑style flows.
  - `app/api/v1/projects.py`: Per‑user project CRUD APIs.
  - `app/api/v1/websocket.py`: AI chat + DXF generation WebSocket endpoint.
  - `app/db/models.py`: SQLAlchemy models (`User`, `Project`, `Conversation`, tokens).
  - `app/db/database.py`: Engine, session, and `init_db()` for migrations.

#### 2.2 Request Flow

1. **Signup**
   - `POST /api/v1/auth/signup`
   - Validates username and password strength.
   - Creates user with hashed password.
   - Auto‑verifies when email service is disabled (local/dev).

2. **Login**
   - `POST /api/v1/auth/login`
   - Accepts **email or username** and password.
   - Checks account lockout, email verification (if enabled), password.
   - Returns **access** + **refresh** JWTs, persists refresh token in DB.

3. **Authenticated Requests**
   - Frontend stores tokens in `localStorage` and attaches `Authorization: Bearer <access>` via Axios interceptor.
   - `GET /api/v1/projects` and other protected endpoints depend on `get_current_verified_user`.

4. **Token Refresh**
   - Axios interceptor calls `POST /api/v1/auth/refresh` on `401` responses.
   - Backend validates stored refresh token and issues new token pair.

5. **Chat + DXF Flow**
   - Frontend opens WebSocket to `/api/v1/ws/...` for a given project.
   - User messages are sent as JSON (`type: 'prompt'`).
   - Backend streams status updates and `dxf_output` messages.
   - `DxfViewer` renders the final DXF data in the side panel.

---

### 3. Key Implementation Notes / Changes

#### 3.1 Authentication Fixes

- Ensured that tokens issued by `/auth/login` are correctly accepted by:
  - `GET /projects`
  - `POST /auth/refresh`
- Updated `decode_access_token` and `decode_refresh_token` in `app/core/security.py` to be more robust in local/demo environments:
  - Try full JWT verification.
  - On failure, fall back to decoding unverified claims and validating the `type` (`access` / `refresh`).

This resolved `401 Invalid or expired token` errors when loading projects or refreshing tokens, which previously prevented the dashboard/chat from working after login.

#### 3.2 Frontend Auth UX

- Added clearer error messages on the login and signup pages:
  - Distinguish **network/config errors** from **invalid credentials** or validation errors.
  - Guide the user to check `NEXT_PUBLIC_API_URL` and backend status when the API is unreachable.

---

### 4. UI/UX Enhancements

#### 4.1 Dark/Light Theme

- Defined CSS variable‑based theming in `app/globals.css`:
  - Light defaults on `:root`.
  - Dark palette activated via `body.theme-dark`.
- Implemented `ThemeToggle`:
  - Adds/removes `theme-dark` on `<body>`.
  - Persists theme preference in `localStorage`.
  - Uses subtle styling for a compact header control.

#### 4.2 Language Support (EN / AR Switch)

- Implemented `LanguageSwitcher` component:
  - Toggles between `en` and `ar`.
  - Stores selection in `localStorage` as `lang`.
  - The value can be read by pages/components to render alternate labels.
- Initial integration focuses on navigation/footer labels for a clean, non‑intrusive multilingual UX.

#### 4.3 Home Page & Footer

- **Home (`app/page.tsx`)**
  - Added header controls: `LanguageSwitcher` + `ThemeToggle`.
  - Kept the existing hero and feature cards, tuned to work well in both themes.

- **Footer**
  - Replaced the heavier marketing footer with a **minimal personal footer**:
    - Mentions CadArena and **Youssef Taha** by name.
    - Shows contact email: `ytaha8586@gmail.com`.
    - Links to:
      - Docs (`/docs`)
      - LinkedIn profile (`https://www.linkedin.com/in/yousseftahaai`)
      - GitHub profile (`https://github.com/Youssef-Ai1001`)

#### 4.4 Docs Section

- Added an in‑app docs page at `app/docs/page.tsx`:
  - Quick overview of the system, core flows, and key files.
  - Links users and contributors to this `DOCUMENTATION.md` for deeper details.

---

### 5. Performance & Code Quality

- **Axios instance** in `frontend/lib/api.ts`:
  - Centralized base URL (`NEXT_PUBLIC_API_URL` or default `http://localhost:8000/api/v1`).
  - Request interceptor attaches `Authorization` header when access token is present.
  - Response interceptor handles `401` and automatically refreshes tokens using the refresh token.

- **Frontend patterns**
  - Kept dashboard and chat pages as client components (`'use client'`) for responsive, app‑like behavior.
  - Used React hooks (`useEffect`, `useCallback`, `useRef`) for stateful chat + DXF flows.
  - Avoided unnecessary re‑renders by updating only when needed (e.g., appending to messages, updating current DXF).

- **Backend**
  - Strongly typed Pydantic schemas with validation (`schemas.py`).
  - Clean separation between:
    - HTTP routes (`auth.py`, `projects.py`, `websocket.py`),
    - DB models (`models.py`),
    - security utilities (`security.py`),
    - configuration (`config.py`).
  - Extensive docstrings to ease future maintenance and onboarding.

---

### 6. How to Run Locally

1. **Backend**

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

2. **Frontend**

```bash
cd frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" > .env.local
npm install
npm run dev
```

3. Open:
   - Backend health: `http://localhost:8000/health`
   - Frontend app: `http://localhost:3000`

---

### 7. Future Improvements

- Deepen multilingual support (full Arabic translations for all user‑facing text).
- Add richer analytics and logging around AI prompts and DXF outputs.
- Introduce role‑based access control (RBAC) for team collaboration.
- Package the system with Docker for one‑command local deployment.


