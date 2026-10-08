<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

## Project

Priority Queue ticketing website (antrian tiket). Multiple queue types (jenis antrian); every ticket belongs to one queue type and carries a priority that determines call order. **TypeScript is mandatory everywhere — never write `.js`/`.jsx`.**

## Stack (verified)

- **Next.js 16.4.0** (App Router) + React 19.3 + TypeScript 5 + Tailwind v4 + ESLint 9, npm.
- Next.js 16 bundles version-matched docs at `node_modules/next/dist/docs/` — **read them before writing code**; do not trust pre-16 training data. See e.g. `01-app/01-getting-started/15-route-handlers.md`, `01-app/02-guides/ai-agents.md`.
- Route/type conventions differ from older Next: e.g. pages/layouts use generated `LayoutProps<"/">` / `PageProps<...>` types (see `app/layout.tsx`).
- Commands (from `package.json`): `npm run dev`, `npm run build`, `npm run start`, `npm run lint` (= `eslint`), `npm run typecheck` (= `tsc --noEmit`).
- **`typecheck` needs generated types:** `LayoutProps<"/">` / `PageProps<...>` are globals produced by Next into `.next/types`. A clean checkout with no `.next/` fails `tsc` with `Cannot find name 'LayoutProps'`. Run `npm run build` (or start `next dev`) first. Verification order: `npm run lint` → `npm run build` → `npm run typecheck`.
- Scaffold enables **Cache Components** and **Partial Prefetching** by default (see build output).
- **Next.js 16 gotchas hit while building this app (all verified, do not rediscover):**
  - `export const dynamic = "force-dynamic"` is **incompatible with Cache Components** — it fails the build. Route handlers reading the file store stay dynamic anyway; do not add it.
  - `middleware.ts` is **deprecated**; use `proxy.ts` exporting `proxy()` + `config.matcher`. `proxy.ts` must not import shared modules — inline constants (cookie name is duplicated there on purpose).
  - `useSearchParams()` in a Client Component **blocks prerendering**; wrap the consumer in `<Suspense>` (see `app/login/page.tsx`).
  - ESLint's `react-hooks/set-state-in-effect` (React 19) rejects synchronous `setState` in an effect body. Use the async-tick pattern in `lib/use-polling-state.ts`.
  - dummyjson `/auth/login` returns a **flat** payload (`accessToken`, `id`, `username`, `firstName`, ...), NOT nested under `user`. `app/api/auth/login/route.ts` handles both shapes.

## Architecture

- `lib/types.ts` — domain types + priority helpers. **Frozen interface; do not edit without sign-off.**
- `CONTRACT.md` — the frozen API surface + ownership split. Read it before touching backend or frontend.
- Backend: `app/api/**` route handlers, `lib/store.ts` (JSON file store at `.data/state.json`), `lib/auth.ts`, `lib/api-helpers.ts`, `proxy.ts`.
- Frontend: `app/**` pages/components (except `api/`), `lib/api-client.ts`, `lib/use-polling-state.ts`.
- `lib/api-client.ts` uses **positional args** (`createQueueType(code, name)`, `createTicket(queueTypeId, priority)`, `login(username, password)`), not object args.
- Keep `lib/types.ts` and `CONTRACT.md` in sync with any real interface change.

## Pages

- `/dashboard` — admin. Manage queue types and tickets, issue tickets, set priority, **reset all tickets (daily reset)**. Protected (login required).
- `/kiosk` — public, two modes toggled in-page:
  - **Display** (`Layar Antrian`): shows the currently active (called) number for every active queue type side by side (N types → N panels); auto-updates as new queue types are added.
  - **Ambil Nomor** (self-service): visitors press to issue their own ticket, including priority options. Not admin-gated.
  - Fullscreen toggle (also double-click) enters the fullscreen API; the navbar hides while fullscreen (`components/site-header.tsx` listens to `fullscreenchange`).
- `/operator` — protected. Shows next ticket(s) per queue type and calls the next number.
- `/login` — posts to `/api/auth/login`.

## Auth

- Users source: `https://dummyjson.com/users`; login: `POST https://dummyjson.com/auth/login` (username + password, returns `accessToken` + user). Test users and credentials are listed there.
- Login gates `/dashboard` and `/operator` only. `/kiosk` is public.
- dummyjson tokens expire — do not persist them beyond the session or commit them. No secrets in the repo.

## UI rules

- Before building or editing any UI (kiosk panels, dashboards, login), load the `antislop` and `antislop-ui` skills and follow them. Highlights for this repo: no default blue-purple gradients or decorative glows; status dots/pulses only on the kiosk for real "now calling" state; no invented stat numbers or filler names — real ticket data or labelled placeholders; empty/loading/error states must name cause + next action; every button and nav link does something real.

## Decisions (resolved)

- Persistence: server-side JSON file store (`.data/state.json`, gitignored), single source of truth.
- Kiosk auto-refresh: client polling of `/api/state` (every 3s). No SSE.
- State: no client store library — `fetch` in components + `lib/api-client.ts`.
