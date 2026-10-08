# CONTRACT.md — frozen interface (do not change without Commander approval)

Both Frontend (Agent 1) and Backend (Agent 2) MUST conform to this. Source of truth for types:
`lib/types.ts` (already written). Do not edit `lib/types.ts` without Commander sign-off.

## Domain types (`lib/types.ts`)

- `QueueType { id, code, name, active }`
- `Ticket { id, queueTypeId, number, priority, status, createdAt, calledAt }`
- `TicketStatus = "waiting" | "called" | "done" | "skipped"`
- `PriorityLevel = "normal" | "lansia" | "disabilitas" | "vip"`
- `AppState { queueTypes: QueueType[]; tickets: Ticket[] }`
- Helpers: `nextTicketForType(state, typeId)`, `activeTicketForType(state, typeId)`.

## Persistence

Server-side JSON file store at `.data/state.json` (gitignored). Single source of truth for
all clients. Seeded with 2 queue types (`A` Teller, `B` CS) and no tickets on first read.

## HTTP API (route handlers under `app/api/**`)

All responses JSON. All errors: `{ error: string }` with proper status code.

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/state` | — | `AppState` |
| POST | `/api/queue-types` | `{ code, name }` | `QueueType` (201) |
| PATCH | `/api/queue-types/[id]` | `{ name?, active? }` | `QueueType` |
| DELETE | `/api/queue-types/[id]` | — | `{ ok: true }` |
| POST | `/api/tickets` | `{ queueTypeId, priority }` | `Ticket` (201) — server assigns `number` as `${code}-${seq}` |
| POST | `/api/tickets/[id]/call` | — | `Ticket` — sets status `called`, `calledAt` now; any previously `called` ticket of same type → `done` |
| POST | `/api/tickets/[id]/done` | — | `Ticket` |
| POST | `/api/tickets/[id]/skip` | — | `Ticket` |
| POST | `/api/tickets/reset` | `{ queueTypeId? }` or empty | `{ ok: true, removed, scope }` — empty body resets ALL tickets (daily reset); `queueTypeId` resets only that type |
| POST | `/api/auth/login` | `{ username, password }` | `{ accessToken, user }` proxied from dummyjson (server-side, never expose credentials) |

`number` format: `${queueType.code}-${String(seq).padStart(3, "0")}` where `seq` counts
existing tickets of that type + 1.

## Auth

- `POST /api/auth/login` proxies to `https://dummyjson.com/auth/login` server-side.
- Session: httpOnly cookie `session` = dummyjson `accessToken` + username.
- Middleware (or server-side guard) protects `/dashboard` and `/operator`; `/kiosk` is public.
- Never log or persist credentials beyond the cookie. Cookie not permanent.

## Frontend ownership (Agent 1)

- `app/**` pages/components EXCEPT `app/api/**`.
- `app/kiosk/page.tsx` — public, two in-page modes: **Display** (one panel per active
  queue type, poll `/api/state` every 3s, no issue action) and **Ambil Nomor** (self-service
  visitors issue their own tickets via `POST /api/tickets`). Fullscreen toggle hides the navbar.
- `app/dashboard/page.tsx` — admin: manage queue types + issue tickets + set priority
  + **reset all tickets** (`POST /api/tickets/reset`).
- `app/operator/page.tsx` — protected: next ticket per type + Call Next button.
- `app/login/page.tsx` — login form posting to `/api/auth/login`.
- `components/**` (incl. `site-header.tsx`, which hides on `fullscreenchange`), `lib/api-client.ts`, `lib/use-polling-state.ts`.
- Follow `antislop` + `antislop-ui` skills. Load them before UI work.

## Backend ownership (Agent 2)

- `app/api/**`, `lib/store.ts` (fs read/write with a module-level mutex promise),
  `lib/auth.ts`, `proxy.ts`. Seed data in `lib/seed.ts`.

## Verification (Agent 3 / QC + everyone)

- `npm run lint` → `npm run build` → `npm run typecheck` (typecheck needs `.next/types`, so run it after build).
- Reviewer independently checks: contract conformance, auth gating, kiosk Display mode is
  read-only while Ambil Nomor mode can issue tickets, priority ordering (a `vip` waiting
  ticket pre-empts older `normal` ones), reset clears tickets.
