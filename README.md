# MeetMint 🌿

> **Distributed team meeting scheduler** — finds when everyone can meet, shown in each person's own local time.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Next.js](https://img.shields.io/badge/Next.js%2016-000?style=flat&logo=nextdotjs)](https://nextjs.org)
[![Express](https://img.shields.io/badge/Express-404D59?style=flat)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB%20Atlas-47A248?style=flat&logo=mongodb&logoColor=white)](https://mongodb.com/atlas)

---

## What it does

A coordinator can:

1. **Add participants** — name, IANA timezone, daily availability window, pre-existing meetings
2. **Search for slots** — specify duration, date range, step size, and ranking strategy
3. **See results** — each suggested slot shown in every participant's own local time

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), Tailwind CSS v4, shadcn/ui (Nova) |
| State | Zustand (UI state) + TanStack Query (server state) |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB Atlas (Mongoose) |
| Validation | Zod (both frontend + backend) |

---

## Architecture

### Backend patterns

| Pattern | Where | Why |
|---|---|---|
| **Singleton** | `db.ts` | Single MongoDB connection across hot reloads |
| **Repository** | `IParticipantRepository` + `ParticipantRepository` | Decouples services from Mongoose |
| **Service Layer** | `ParticipantService`, `SlotService` | Business logic isolated from routes |
| **Strategy** | `IScoringStrategy` + 4 implementations | Swap ranking algorithm without touching Scheduler |
| **Adapter** | `ICalendarAdapter` + `NoOpCalendarAdapter` | Google/Outlook hook ready, zero service changes |
| **DI (manual)** | `container.ts` | Constructor injection, swap impl by changing one file |

### Solver algorithm

The core scheduling algorithm (`solver.ts`) uses a **sweep-line approach**:

- **Complexity:** O((P+B) log(P+B)) per day, where P = participants, B = busy blocks  
- **DST safe:** All time math in UTC milliseconds via [luxon](https://moment.github.io/luxon/)  
- **Pure function:** No DB calls, fully unit-testable

### Ranking strategies

| Strategy | Scoring |
|---|---|
| `attendance` | Maximize participants available (default) |
| `convenience` | Penalise slots outside 08:00–18:00 local |
| `fairness` | Minimize variance in local-time inconvenience |
| `hybrid` | Weighted blend: 50% attendance + 30% convenience + 20% fairness |

---

## Getting started

### Prerequisites

- Node.js ≥ 20
- MongoDB Atlas cluster (free tier works)

### 1. Clone & install

```bash
git clone https://github.com/your-org/meetmint
cd meetmint

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure environment

```bash
# backend/.env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/meetmint?retryWrites=true&w=majority
PORT=4000
NODE_ENV=development

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

### 3. Run locally

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Backend: `http://localhost:4000/api/v1`  
Frontend: `http://localhost:3000`

> **Auto-seed:** On first startup the backend seeds Maya, Tom, Sara and Jack (from the brief) automatically. The UI is ready immediately.

---

## API reference

### Participants

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/participants` | List all participants |
| `POST` | `/api/v1/participants` | Add participant |
| `PUT` | `/api/v1/participants/:id` | Update participant |
| `DELETE` | `/api/v1/participants/:id` | Remove participant |
| `POST` | `/api/v1/participants/:id/busy` | Add busy block |
| `DELETE` | `/api/v1/participants/:id/busy/:blockId` | Remove busy block |

### Slots

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/slots` | Find meeting slots |

**POST /api/v1/slots body:**

```json
{
  "durationMinutes": 45,
  "dateRangeStart": "2026-03-08",
  "dateRangeEnd": "2026-03-14",
  "granularityMinutes": 15,
  "maxResults": 10,
  "strategy": "attendance"
}
```

**Response includes:**

```json
{
  "slots": [
    {
      "startUtc": "2026-03-09T08:00:00.000Z",
      "endUtc": "2026-03-09T08:45:00.000Z",
      "availableCount": 3,
      "totalCount": 4,
      "unavailable": ["Sara"],
      "localTimes": [
        { "name": "Maya", "timezone": "Asia/Kolkata", "date": "2026-03-09", "start": "13:30", "end": "14:15", "isAvailable": true },
        { "name": "Tom",  "timezone": "Europe/London", "date": "2026-03-09", "start": "08:00", "end": "08:45", "isAvailable": true }
      ]
    }
  ],
  "noFullOverlap": true,
  "totalCandidatesEvaluated": 847,
  "strategy": "attendance"
}
```

---

## Project structure

```
meetmint/
├── backend/
│   └── src/
│       ├── adapters/      # Calendar adapter interface + no-op stub
│       ├── container.ts   # Manual DI wiring
│       ├── db.ts          # MongoDB singleton
│       ├── errors/        # AppError + global error middleware
│       ├── middleware/     # Zod validation + rate limiters
│       ├── models/        # Mongoose schemas
│       ├── repositories/  # IParticipantRepository + Mongoose impl
│       ├── routes/v1/     # Versioned Express routes
│       ├── seed.ts        # Demo data (Maya, Tom, Sara, Jack)
│       ├── services/      # ParticipantService, SlotService
│       └── solver/
│           ├── solver.ts          # Sweep-line algorithm (pure)
│           ├── Scheduler.ts       # Strategy host + STRATEGY_MAP
│           └── strategies/        # 4 IScoringStrategy implementations
└── frontend/
    ├── app/               # Next.js App Router pages + layout
    ├── components/        # UI components (shadcn + custom)
    ├── hooks/             # TanStack Query hooks (server state)
    ├── lib/api/           # API facade (client, participants, slots)
    ├── lib/types.ts       # Shared TypeScript types + Zod schemas
    └── store/             # Zustand stores (UI state only)
```

---

## Deployment (Vercel — manual)

### Backend

Deploy the `backend/` directory to Vercel (or any Node.js host like Railway/Render):

1. Set environment variables: `MONGODB_URI`, `PORT`, `NODE_ENV=production`
2. Build command: `npm run build`
3. Start command: `npm start`

### Frontend

1. Import `frontend/` to Vercel
2. Set: `NEXT_PUBLIC_API_URL=https://your-backend-url.vercel.app/api/v1`
3. Deploy

---

## Design decisions

- **No full overlap for the brief's team** — The 4 participants span 4 continents; no common time window during weekdays. MeetMint returns the best partial matches and clearly signals `noFullOverlap: true`.
- **Strategies are pure** — Adding a new scoring approach requires only a new class implementing `IScoringStrategy`. Zero changes to `Scheduler`.
- **Zustand for UI, TanStack Query for server** — Clean separation prevents stale cache bugs. Zustand stores only dialog open/close state and search form values.
- **Rate limiting tiered** — The slot solver is expensive (sweep-line over 60 days × many participants). A tighter 20 req/15min limit protects it separately from the general 100 req/15min limit.
