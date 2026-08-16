# PLAN.md — MeetMint: Meeting Scheduler

> Written **before** any code. Captures every architectural and product decision so
> the reader can evaluate judgment independently of the implementation.

---

## 1. Understanding the Problem

### Core challenge
Finding a mutual meeting window across people in different time zones is a
timezone-arithmetic problem first, a UX problem second, and an API problem third.
The tool eliminates the mental-math burden entirely.

### What "useful back" means when no full overlap exists
The brief says "an empty screen isn't good enough." This means:
- Show the **best partial-overlap slots**, ranked by participant count.
- Name the unavailable participants so the coordinator can make an informed trade-off.

### Pre-existing meetings
Modelled as **busy blocks** — optional per-participant time ranges the solver avoids.

---

## 2. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| **Frontend** | **Next.js 16 (App Router)** | Latest stable, Vercel-native, RSC support |
| **UI Library** | **shadcn/ui** | Radix primitives, accessible, composable |
| **Styling** | **Tailwind CSS v4** | Latest utility-first CSS, co-located styles |
| **Client State** | **Zustand** (split stores) | UI-only state; lightweight, no boilerplate |
| **Server State** | **TanStack Query v5** | Caching, refetching, loading/error, mutations |
| **Frontend Validation** | **Zod** | Schema-first validation shared with backend types |
| **Backend** | **Express.js + Node.js 20 (TypeScript)** | Standalone REST API, clean separation |
| **Backend Validation** | **Zod** | Runtime validation on all request bodies |
| **Timezone** | **luxon** | IANA tz arithmetic, DST-correct per-day |
| **Database** | **MongoDB Atlas** (M0 free) | Persistent across cold starts, free tier |
| **ODM** | **Mongoose** | Schema + validation on MongoDB |
| **Testing** | **Jest + ts-jest** | Unit tests for solver, strategies, services |
| **Hosting (FE)** | **Vercel** (manual) | Next.js-native, dashboard import |
| **Hosting (BE)** | **Vercel** (manual) | Node serverless, dashboard import |

---

## 3. Architecture & Design Patterns

### 3.1 Singleton Pattern — MongoDB Connection
One connection instance shared across all requests. Prevents connection exhaustion
in serverless environments where each function invocation could otherwise open a new connection.

```
db.ts
  └── cached singleton: mongoose.connect() called once, reused everywhere
```

### 3.2 Repository Pattern — Data Access Layer
Routes never touch Mongoose directly. All DB operations go through a repository.
This decouples business logic from persistence — swapping MongoDB for Postgres
only requires rewriting the repository.

```
repositories/
  └── ParticipantRepository.ts
        ├── findAll()
        ├── findById()
        ├── create()
        ├── update()
        ├── delete()
        ├── addBusyBlock()
        └── removeBusyBlock()
```

### 3.3 Service Layer Pattern — Business Logic
Services sit between routes and repositories. They own all business rules:
validation, orchestration, calling the solver, formatting responses.
As solver logic grows, it stays in the service — not leaking into routes.

```
Request → Route (thin) → Service (logic) → Repository (data) → MongoDB
```

### 3.4 Strategy Pattern — Solver Scoring
The solver supports pluggable scoring strategies. Adding a new ranking approach
requires zero changes to the core scheduler — just a new strategy class.

```ts
interface ScoringStrategy {
  score(slot: CandidateSlot, participants: Participant[]): number;
  label: string;
}

class AttendanceStrategy implements ScoringStrategy {
  // maximize number of available participants
  score(slot) { return slot.availableCount; }
}

class ConvenienceStrategy implements ScoringStrategy {
  // penalise early morning / late night local times
  score(slot, participants) { ... }
}

class FairnessStrategy implements ScoringStrategy {
  // avoid repeatedly scheduling inconvenient times for same people
  score(slot, participants) { ... }
}

class HybridStrategy implements ScoringStrategy {
  // weighted blend: attendance + convenience
  score(slot, participants) { ... }
}

class Scheduler {
  constructor(private strategy: ScoringStrategy) {}
  rank(slots: CandidateSlot[]) {
    return slots.sort((a, b) => this.strategy.score(b) - this.strategy.score(a));
  }
}
```

Strategies shipped at launch: **Attendance** (default), **Convenience**, **Fairness**, **Hybrid**.
The UI exposes a strategy selector. The POST /api/v1/slots body accepts a `strategy` field.

### 3.5 Adapter Pattern — Calendar Integration
Future calendar providers (Google Calendar, Outlook, iCal) are abstracted behind a
common interface. Adding a new provider requires only a new Adapter — zero changes
to the service layer.

```ts
interface CalendarAdapter {
  getBusyBlocks(userId: string, dateRange: DateRange): Promise<BusyBlock[]>;
}

class GoogleCalendarAdapter implements CalendarAdapter { ... }
class OutlookCalendarAdapter implements CalendarAdapter { ... }
class ICalAdapter implements CalendarAdapter { ... }  // stub, not implemented yet
```

The `ParticipantService` accepts an optional `CalendarAdapter` — currently unused
(null/no-op), but the hook is there for future integration without structural change.

### 3.6 Dependency Injection
No class creates its own dependencies. Everything is injected via constructor.
This makes unit testing trivial — inject a mock repository, no DB needed.

```ts
// Bad
class ParticipantService {
  constructor() { this.repo = new ParticipantRepository(); } // hard coupling
}

// Good
class ParticipantService {
  constructor(
    private repo: IParticipantRepository,
    private calendarAdapter?: CalendarAdapter
  ) {}
}
```

Wired at startup in `src/container.ts` (manual DI, no framework needed at this scale).

### 3.7 Global Error Handler
All errors bubble up via a custom `AppError` class. One central middleware
converts them to HTTP responses — no try/catch scattered across routes.

```
Controller → throw new AppError(404, "Participant not found")
                         ↓
              Global Error Middleware
                         ↓
              { error: "Participant not found", status: 404 }
```

---

## 4. Project Structure

```
meetmint/
├── PLAN.md
├── README.md
│
├── backend/                              ← Standalone Express API (TypeScript)
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                              ← gitignored
│   └── src/
│       ├── index.ts                      ← server bootstrap
│       ├── app.ts                        ← Express app factory
│       ├── container.ts                  ← DI wiring
│       ├── db.ts                         ← MongoDB singleton
│       ├── errors/
│       │   ├── AppError.ts
│       │   └── errorMiddleware.ts        ← global error handler
│       ├── models/
│       │   └── participant.model.ts      ← Mongoose schema
│       ├── repositories/
│       │   ├── IParticipantRepository.ts ← interface
│       │   └── ParticipantRepository.ts  ← Mongoose implementation
│       ├── services/
│       │   ├── ParticipantService.ts
│       │   └── SlotService.ts            ← orchestrates solver + strategy
│       ├── solver/
│       │   ├── solver.ts                 ← core sliding-window + sweep line
│       │   ├── strategies/
│       │   │   ├── IScoringStrategy.ts
│       │   │   ├── AttendanceStrategy.ts
│       │   │   ├── ConvenienceStrategy.ts
│       │   │   ├── FairnessStrategy.ts
│       │   │   └── HybridStrategy.ts
│       │   └── Scheduler.ts              ← Strategy Pattern host
│       ├── adapters/
│       │   ├── ICalendarAdapter.ts
│       │   └── NoOpCalendarAdapter.ts    ← stub; real adapters added later
│       ├── validators/
│       │   ├── participantSchema.ts      ← Zod schemas
│       │   └── slotSchema.ts
│       ├── middleware/
│       │   ├── validate.ts               ← Zod middleware wrapper
│       │   └── rateLimiter.ts            ← express-rate-limit config
│       └── routes/
│           └── v1/
│               ├── index.ts              ← mounts all v1 routes
│               ├── participants.routes.ts
│               ├── busy.routes.ts
│               └── slots.routes.ts
│
└── frontend/                             ← Next.js 16 app (TypeScript)
    ├── package.json
    ├── tsconfig.json
    ├── next.config.mjs
    ├── tailwind.config.ts                ← Tailwind v4
    ├── components.json                   ← shadcn/ui config
    ├── .env.local                        ← gitignored
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── page.tsx                  ← coordinator dashboard
        │   └── globals.css
        ├── components/
        │   ├── ui/                       ← shadcn/ui generated
        │   ├── ParticipantCard.tsx
        │   ├── AddParticipantDialog.tsx
        │   ├── BusyBlockDialog.tsx
        │   ├── SlotSearchForm.tsx
        │   └── SlotResultCard.tsx
        ├── lib/
        │   ├── api/
        │   │   ├── client.ts             ← base fetch wrapper (API Facade)
        │   │   ├── participants.ts        ← participantApi.getAll(), .create() …
        │   │   ├── slots.ts              ← slotApi.find()
        │   │   └── busyBlocks.ts         ← busyBlockApi.create(), .delete()
        │   └── types.ts                  ← shared TypeScript interfaces + Zod schemas
        ├── store/                        ← Zustand (UI state only)
        │   ├── participantStore.ts        ← selected participant, dialog open state
        │   ├── slotStore.ts              ← selected strategy, active slot
        │   └── searchStore.ts            ← dateRange, duration, granularity
        └── hooks/
            ├── useParticipants.ts        ← TanStack Query: participants fetching/mutations
            ├── useBusyBlocks.ts          ← TanStack Query: busy block mutations
            └── useSlots.ts              ← TanStack Query: slot search
```

---

## 5. State Architecture (Frontend)

```
Frontend State
      │
      ├── Zustand (UI State)
      │     ├── participantStore  — selected participant, add-dialog open
      │     ├── slotStore         — selected strategy, highlighted slot
      │     └── searchStore       — dateRange, durationMinutes, granularity
      │
      └── TanStack Query (Server State)
            ├── participants      — cache, loading, error, refetch
            ├── busy blocks       — mutations with optimistic updates
            └── slots             — search results, loading, error
```

UI components never call `fetch()` directly. They use:
- `useParticipants()` hook (TanStack Query) for server data
- `participantStore` (Zustand) for local UI state (which dialog is open, etc.)

---

## 6. Frontend API Facade (`lib/api/`)

The UI never constructs URLs. All API knowledge is encapsulated in the facade:

```ts
// lib/api/participants.ts
export const participantApi = {
  getAll: ()               => client.get('/participants'),
  create: (data)           => client.post('/participants', data),
  update: (id, data)       => client.put(`/participants/${id}`, data),
  remove: (id)             => client.delete(`/participants/${id}`),
};

// lib/api/busyBlocks.ts
export const busyBlockApi = {
  create: (pid, data)      => client.post(`/participants/${pid}/busy`, data),
  remove: (pid, blockId)   => client.delete(`/participants/${pid}/busy/${blockId}`),
};

// lib/api/slots.ts
export const slotApi = {
  find: (params)           => client.post('/slots', params),
};
```

---

## 7. Solver Design (Optimised)

### Approach: Precomputed Intervals + Sweep Line
Instead of checking every participant at every UTC tick, we:
1. **Precompute** each participant's availability as a UTC interval per day.
2. Run a **sweep line** over sorted interval endpoints to find overlap regions.
3. Subtract busy blocks from those regions.
4. Slice remaining regions into `durationMinutes` windows.
5. Score and rank via the selected Strategy.

```
Availability as UTC intervals (per day):
  Maya  ────────[03:30 ─────────── 12:30]────────────
  Tom   ──────────────[08:00 ──────────────── 17:00]──
  Sara  ──────────────────────────[14:00 ───── 23:00]─
  Jack  [00:00── 08:00]───────────────────────[23:00]─

Sweep events (sorted):
  03:30 Maya enters  → count 1
  08:00 Tom  enters  → count 2
  12:30 Maya leaves  → count 1
  14:00 Sara enters  → count 2
  17:00 Tom  leaves  → count 1
  23:00 Jack enters  → count 2

Regions where count ≥ 2 are candidate windows.
Slice into durationMinutes chunks → subtract busy blocks → score → rank.
```

Complexity: **O((P + B) log(P + B))** per day (sort + sweep) vs the naive O(D × S × P × B).

### Scoring via Strategy Pattern
After generating candidate windows, the selected strategy scores each:

```ts
const scheduler = new Scheduler(new AttendanceStrategy());
const ranked = scheduler.rank(candidates);
```

The `strategy` field in `POST /api/v1/slots` selects which strategy to use.
Default: `"attendance"`.

---

## 8. API Design

**Base URL (local):** `http://localhost:4000/api/v1`
**Base URL (production):** `https://meetmint-api.vercel.app/api/v1`

| Method   | Path                                     | Description              |
|----------|------------------------------------------|--------------------------|
| `GET`    | `/participants`                          | List all participants    |
| `POST`   | `/participants`                          | Add a participant        |
| `PUT`    | `/participants/:id`                      | Update a participant     |
| `DELETE` | `/participants/:id`                      | Remove a participant     |
| `POST`   | `/participants/:id/busy`                 | Add a busy block         |
| `DELETE` | `/participants/:id/busy/:blockId`        | Remove a busy block      |
| `POST`   | `/slots`                                 | Find meeting slots       |
| `GET`    | `/health`                                | Health check             |

### POST /slots — Request (Zod-validated)
```jsonc
{
  "durationMinutes": 45,       // 15–480
  "dateRangeStart": "2026-03-08",
  "dateRangeEnd":   "2026-03-14",   // max 60 days from start
  "granularityMinutes": 15,    // 5 | 15 | 30 (default 15)
  "maxResults": 10,            // 1–50 (default 10)
  "strategy": "attendance"     // "attendance" | "convenience" | "fairness" | "hybrid"
}
```

### POST /slots — Response
```jsonc
{
  "slots": [ /* Slot objects, strategy-ranked */ ],
  "strategy": "attendance",
  "noFullOverlap": true,
  "totalCandidatesEvaluated": 84
}
```

### Slot Object
```jsonc
{
  "startUtc": "2026-03-09T08:00:00Z",
  "endUtc":   "2026-03-09T08:45:00Z",
  "score": 3,
  "totalParticipants": 4,
  "unavailable": ["Sara"],
  "localTimes": [
    { "name": "Maya", "timezone": "Asia/Kolkata",        "date": "2026-03-09", "start": "13:30", "end": "14:15" },
    { "name": "Tom",  "timezone": "Europe/London",       "date": "2026-03-09", "start": "08:00", "end": "08:45" },
    { "name": "Sara", "timezone": "America/Los_Angeles", "date": "2026-03-09", "start": "00:00", "end": "00:45" },
    { "name": "Jack", "timezone": "Australia/Sydney",    "date": "2026-03-09", "start": "19:00", "end": "19:45" }
  ]
}
```

---

## 9. Zod Validation

All request bodies validated at the route level via a `validate(schema)` middleware.
Validation errors return `400` with structured field-level messages.

```ts
// validators/slotSchema.ts
export const slotRequestSchema = z.object({
  durationMinutes:    z.number().int().min(15).max(480),
  dateRangeStart:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dateRangeEnd:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  granularityMinutes: z.enum([5, 15, 30]).default(15),
  maxResults:         z.number().int().min(1).max(50).default(10),
  strategy:           z.enum(["attendance","convenience","fairness","hybrid"]).default("attendance"),
}).refine(d => daysBetween(d.dateRangeStart, d.dateRangeEnd) <= 60, {
  message: "Date range cannot exceed 60 days"
});
```

---

## 10. Rate Limiting

Applied via `express-rate-limit` to protect the solver endpoint:

| Limit | Config |
|---|---|
| `POST /api/v1/slots` | 20 requests / 15 min per IP |
| All other routes | 100 requests / 15 min per IP |
| Max participants in DB | 50 (enforced in service layer) |
| Max date range | 60 days (enforced via Zod) |
| Max granularity resolution | 5 min (prevents O(n) explosion) |

---

## 11. Error Handling

```
Route Handler
     ↓
throw new AppError(statusCode, message, details?)
     ↓
Global Error Middleware (errors/errorMiddleware.ts)
     ↓
{ "error": "message", "status": 404, "details": [...] }
```

All unhandled promise rejections and uncaught exceptions are also caught and
forwarded to the global handler.

---

## 12. Testing Architecture

```
backend/tests/
├── unit/
│   ├── solver.test.ts               ← pure function, no DB
│   ├── strategies/
│   │   ├── attendance.test.ts
│   │   ├── convenience.test.ts
│   │   └── fairness.test.ts
│   └── services/
│       └── participantService.test.ts  ← mock repository injected
└── integration/
    └── slots.test.ts                ← supertest against in-memory MongoDB
```

**Test runner:** Jest + ts-jest
**DB for integration tests:** `mongodb-memory-server`

---

## 13. Data Model

### Mongoose Schema — Participant
```ts
{
  name:           String  // required
  timezone:       String  // IANA tz, e.g. "Asia/Kolkata"
  availableStart: String  // "HH:mm" local
  availableEnd:   String  // "HH:mm" local
  busyBlocks: [{
    date:  String         // "YYYY-MM-DD"
    start: String         // "HH:mm" local
    end:   String         // "HH:mm" local
    label: String         // optional
  }]
}
```

---

## 14. Timezone Analysis for Sample Team

| Name | IANA Timezone | UTC Offset (8–14 Mar 2026) | Window in UTC |
|------|--------------|----------------------------|----------------|
| Maya | Asia/Kolkata | UTC+5:30 (no DST) | 03:30–12:30 |
| Tom  | Europe/London | UTC+0 GMT (DST 29 Mar) | 08:00–17:00 |
| Sara | America/Los_Angeles | UTC-7 (DST started 8 Mar) | 13:00–22:00 |
| Jack | Australia/Sydney | UTC+11 AEDT | 23:00–08:00 next day |

**Sweep line result:**
- Maya ∩ Tom: 08:00–12:30 UTC (4.5 hrs) ✅ — best 2-person window
- Tom ∩ Sara: 13:00–17:00 UTC (4 hrs) ✅
- Maya ∩ Tom ∩ Sara: Maya ends 12:30, Sara starts 13:00 → **no overlap**
- Jack does not overlap any other window
- **Conclusion: Zero 4-person full overlap for any 45-min window.**

The solver returns the best partial-overlap slots (2-person), scored and ranked,
with unavailable participants named. This is the correct "useful back" response.

---

## 15. Environment Variables

### Backend (`backend/.env`)
```
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/meetmint
PORT=4000
CORS_ORIGIN=http://localhost:3000,https://meetmint.vercel.app
NODE_ENV=development
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```
Production:
```
NEXT_PUBLIC_API_URL=https://meetmint-api.vercel.app/api/v1
```

---

## 16. Deployment (Manual — Vercel, no vercel.json)

### Backend
1. Push monorepo to GitHub.
2. Vercel dashboard → **New Project** → import repo → **Root Directory: `backend`**.
3. Set env vars: `MONGODB_URI`, `CORS_ORIGIN`, `NODE_ENV=production`.
4. Deploy → `https://meetmint-api.vercel.app`

### Frontend
1. Vercel dashboard → **New Project** → same repo → **Root Directory: `frontend`**.
2. Set env var: `NEXT_PUBLIC_API_URL=https://meetmint-api.vercel.app/api/v1`.
3. Deploy → `https://meetmint.vercel.app`

---

## 17. What Is Knowingly Left Out

| Item | Reason |
|---|---|
| Real calendar adapters (Google, Outlook) | Adapter interface is wired; implementation is out of scope |
| Authentication / access control | Internal prototype |
| Per-day availability | Simplification noted; model is per-participant |
| Email / iCal export | Out of scope |
| Pagination of slot results | maxResults cap (default 10) is sufficient |
| WebSockets / real-time updates | Not needed for coordinator-driven flow |

---

## 18. Execution Order (Commit Plan)

| # | Commit | Contents |
|---|--------|----------|
| 1 | `plan: add PLAN.md` | This file |
| 2 | `chore: init monorepo, backend TS scaffold` | tsconfig, package.json, folder structure |
| 3 | `feat(be): db singleton + Mongoose model` | `db.ts`, `models/participant.model.ts` |
| 4 | `feat(be): repository + DI container` | `repositories/`, `container.ts` |
| 5 | `feat(be): strategies + scheduler` | `solver/strategies/`, `solver/Scheduler.ts` |
| 6 | `feat(be): solver core (sweep line)` | `solver/solver.ts` |
| 7 | `feat(be): services + global error handler` | `services/`, `errors/` |
| 8 | `feat(be): zod validators + rate limiter + routes v1` | `validators/`, `middleware/`, `routes/v1/` |
| 9 | `test(be): unit tests — solver + strategies + services` | `tests/unit/` |
| 10 | `feat(fe): Next.js 16 + Tailwind v4 + shadcn scaffold` | `frontend/` skeleton |
| 11 | `feat(fe): API facade + types` | `lib/api/`, `lib/types.ts` |
| 12 | `feat(fe): Zustand stores + TanStack Query hooks` | `store/`, `hooks/` |
| 13 | `feat(fe): UI components + dashboard page` | `components/`, `app/page.tsx` |
| 14 | `feat: seed default participants (Maya, Tom, Sara, Jack)` | Seed script / startup seed |
| 15 | `docs: README.md` | Run instructions, env setup, decisions, gaps |
| 16 | `chore: deploy both projects to Vercel` | Live links |

---

*Last updated: added Repository, Service, Strategy, Adapter, DI, Global Error Handler,
split Zustand stores, TanStack Query, API Facade, Zod, rate limiting, sweep-line solver,
Jest tests, API versioning (v1), TypeScript backend, Tailwind v4.*
