# VintiCode

### _Practice the complete interview workflow — not just the code._

**VintiCode** is a full-stack coding practice platform built to simulate how software engineers actually prepare for technical interviews. Most platforms drop you directly into an editor. VintiCode encourages the full workflow: read the problem, plan your approach, get AI feedback on your thinking, then write the code.

---

## Why VintiCode is Different

Every other platform starts at the editor. VintiCode starts one step earlier.

Before a user writes a single line of code, they are guided through a **Scratch Pad** — a private planning space where they can write pseudocode, notes, and ideas. An optional **AI Approach Review**, powered by Gemini, then evaluates whether they have enough understanding to begin implementing.

The AI behaves like a supportive mentor, not a gatekeeper. It never blocks the user from coding. It simply asks: _"Have you thought about this enough to start?"_

This reinforces habits that matter in real interviews:

- Reading the problem carefully
- Planning before coding
- Thinking about edge cases and complexity
- Explaining your thinking

---

## Feature Overview

### Landing Page
- Animated welcome screen with typing effects and background animations
- Auto-redirects authenticated users directly to their dashboard

### Authentication
- Register and login with email and password
- Secure JWT-based sessions stored in `httpOnly` cookies
- 7-day session persistence
- Protected routes with automatic 401 redirects

### Question Dashboard
- List of all available coding challenges
- Difficulty badges (Easy / Medium / Hard)
- Visual indicator showing which questions have been solved

### Scratch Pad (Pre-Coding Planning)
- Private Monaco Editor workspace before every question
- Completely optional — users can skip it at any time
- Character counter, dark/light theme support

### AI Approach Review
- Triggered by "Review My Approach" inside the Scratch Pad
- Calls **Gemini 1.5 Flash** via direct REST API
- Evaluates technical understanding, not writing quality
- Returns one of two verdicts:
  - **Ready to Start Coding** — the user has enough direction
  - **Consider Thinking a Bit More** — the approach needs more planning
- Includes an encouraging summary and up to 3 gentle hints
- Never reveals the algorithm or solves the problem
- Review result is saved to the database (`accepted` / `rejected`)
- User can always continue to coding regardless of the verdict

### Code Editor
- Monaco Editor with syntax highlighting
- Language support: **Python**, **C++**, **Java**, **JavaScript**
- Font size selector (12–24px)
- Dark and light themes
- Resizable split-panel layout (problem statement / editor / console)

### Code Execution
- **Run with custom input** — immediate single execution via Judge0
- **Submit** — runs all hidden test cases asynchronously
- Async architecture: submission queued in Redis, results polled by the client
- Per-test-case status cards (Pending / Loading / Accepted / Failed)
- Output truncation for large stdout (> 3000 characters)
- Time Limit Exceeded detection

### Profile Page
- Submission history with question titles and verdicts
- Solved-question counts broken down by difficulty

### Admin Suite
- Separate authentication layer with its own JWT secret
- **Dashboard** — platform-wide analytics
- **Question Management** — full CRUD for coding challenges including test cases
- **User Management** — view all users and their profiles
- **Submission Oversight** — browse all submissions across the platform
- Monochrome design system built for focus and clarity

---

## User Workflow

```
Landing Page
     ↓
 Auth (Register / Login)
     ↓
 Question Dashboard
     ↓
 Scratch Pad  ←─────────────────┐
  ↙          ↘                  │
Skip     Review My Approach      │
  ↓              ↓               │
  │         Gemini API           │
  │              ↓               │
  │       AI Feedback Card       │
  │        ↙         ↘           │
  │  Edit Approach  Continue ────┘
  ↓
Code Editor
  ├── Run (custom input → immediate result)
  └── Submit (all test cases → async polling)
```

---

## Tech Stack

### Frontend
| Concern | Library |
|---------|---------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, HeroUI |
| Animations | Framer Motion |
| Editor | @monaco-editor/react |
| Icons | Lucide React, Tabler Icons |
| HTTP | Axios |
| Notifications | react-hot-toast |
| Layout | react-resizable-panels |

### Backend
| Concern | Library / Service |
|---------|------------------|
| Framework | Express.js 5 (Controller / Router pattern) |
| Database | PostgreSQL via Prisma ORM |
| Cache / Queue | Redis (ioredis) + BullMQ |
| Code Execution | Judge0 (via RapidAPI) |
| AI Review | Gemini 1.5 Flash (direct REST API) |
| Auth | JWT (separate user + admin secrets) |
| Validation | validator.js, bcrypt |

---

## Architecture

```
Next.js Frontend
      │
      │  REST API (Axios, withCredentials)
      ▼
Express.js Backend
      │
      ├── /api/auth          Register, Login, Logout, Verify
      ├── /api/dashboard     Question list, Question detail
      ├── /api/questions     Run, Submit, Poll results, History
      ├── /api/scratchpad    AI Approach Review → save to DB
      ├── /api/userprofile   Profile, Submission history
      └── /api/admin         Admin CRUD (separate JWT)
            │
            ├── Redis          Async job state (run / submit results)
            ├── Judge0 API     Sandboxed code execution
            ├── Gemini API     Approach review (direct REST call)
            └── PostgreSQL     Users, Questions, Submissions, ScratchPads
```

### Code Execution Flow

**Run (custom input)**
```
POST /questions/runCode/:id
  → Store "processing" in Redis
  → Submit to Judge0 (async)
  → Poll Judge0 until complete
  → Store result in Redis
  → Client polls GET /questions/runCode/result/:submissionId
```

**Submit (all test cases)**
```
POST /questions/submitCode/:id
  → Queue job in Redis
  → Fire background worker (POST /api/run-submission/:id)
  → Worker loops through all test cases via Judge0
  → Store report in Redis + create Submissions record in DB
  → Client polls GET /questions/submission/result/:submissionId
```

### Approach Review Flow

```
POST /api/scratchpad/review
  → geminiService: build prompt → call Gemini 1.5 Flash REST API
  → scratchpadService: map READY→accepted / THINK_MORE→rejected
  → Save ScratchPad record to PostgreSQL
  → Return { status, summary, suggestions, scratchpadId }
```

---

## Database Schema

```
User
  id, name, email, password, createdAt, updatedAt
  → scratchPads[]
  → submissions[]

Questions
  id, title, description, input_format, output_format,
  sample_input, sample_output, test_cases (JSON), difficulty
  → scratchpad[]
  → solvedQuestions[]

ScratchPad
  id, userId, questionId
  status        (accepted | rejected)   ← AI verdict
  explanation   (user's raw notes)
  createdAt, updatedAt
  → submissions[]

Submissions
  id, userId, questionId, languageId,
  scratchpadId (optional FK to ScratchPad),
  code, status (accepted | rejected)
  createdAt, updatedAt
```

---

## Project Structure

```
VintiCode/
├── allgrow-backend/
│   ├── app.js                    Entry point, route registration
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── dashboardController.js
│   │   ├── questionController.js
│   │   ├── scratchpadController.js
│   │   ├── profileController.js
│   │   ├── adminController.js
│   │   └── runSubmission.js      Background test-case worker
│   ├── services/
│   │   ├── geminiService.js      Prompt building + Gemini REST call
│   │   └── scratchpadService.js  Business logic + DB save
│   ├── routes/
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── questions.js
│   │   ├── scratchpad.js
│   │   ├── profile.js
│   │   └── admin.js
│   ├── middleware/
│   │   └── middleware.js         JWT auth (user + admin tiers)
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── prismaClient.js
│   └── redis/
│       └── redis.js
│
└── vinticode-frontend/
    ├── app/
    │   ├── page.tsx                          Landing page
    │   ├── auth/page.tsx                     Login / Register
    │   ├── dashboard/
    │   │   ├── home/page.tsx                 Question list
    │   │   ├── profile/page.tsx              Submission history
    │   │   └── question/[questionId]/
    │   │       ├── page.tsx                  Code editor
    │   │       └── scratchpad/page.tsx       Scratch Pad + AI Review
    │   └── admin/
    │       ├── login/page.tsx
    │       ├── dashboard/page.tsx
    │       ├── questions/page.tsx
    │       ├── users/page.tsx
    │       ├── submissions/page.tsx
    │       └── analytics/page.tsx
    ├── components/
    │   ├── scratchpad/
    │   │   ├── ScratchPad.tsx
    │   │   └── ApproachReview.tsx
    │   └── ui/                               Design system components
    └── lib/
        ├── axios.ts                          Shared axios instance
        ├── authApi.ts
        ├── dashboardApi.ts
        ├── questionsApi.ts
        ├── scratchpadApi.ts
        └── profileApi.ts
```

---

## Environment Variables

### `allgrow-backend/.env`

```env
# Server
PORT=7777
FRONTEND_URL="http://localhost:3001"
BACKEND_URL="http://localhost:7777"

# Database
DATABASE_URL="postgresql://..."

# Redis
REDIS_URL="rediss://..."

# Auth
JWT_SECRET=""
ADMIN_JWT_SECRET=""
ADMIN_EMAIL=""
ADMIN_PASSWORD=""

# Judge0 (RapidAPI) — rotate keys to avoid rate limits
JUDGE0_API="https://judge0-ce.p.rapidapi.com"
USER_1='{"x-rapidapi-key":"...","x-rapidapi-host":"judge0-ce.p.rapidapi.com"}'
USER_2='...'

# Gemini AI (get a free key at aistudio.google.com)
GEMINI_API_URL="https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
GEMINI_API_KEY=""
```

### `vinticode-frontend/.env`

```env
NEXT_PUBLIC_BACKEND_URL="http://localhost:7777"
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL instance (local or [Neon](https://neon.tech))
- Redis instance (local or [Upstash](https://upstash.com))
- RapidAPI key with Judge0 access
- Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Setup

```bash
# 1. Clone
git clone https://github.com/yatinsingh2007/VintiCode.git
cd VintiCode

# 2. Backend
cd allgrow-backend
npm install
# Fill in .env (see above)
npx prisma generate
npx prisma migrate dev
npm run dev          # runs on port 7777

# 3. Frontend (new terminal)
cd ../vinticode-frontend
npm install
# Fill in .env
npm run dev          # runs on port 3001
```

---

## License

Distributed under the ISC License.

---

Built by [Yatin Singh](https://github.com/yatinsingh2007)
