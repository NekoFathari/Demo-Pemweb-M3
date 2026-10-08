# TODO

## M1: Priority Queue ticketing website (Next.js 16 + TS) | status: completed

### T1.1: Scaffold + freeze contract | status: completed
- [x] S1.1.1: Scaffold Next.js 16.4 + TS + Tailwind v4, move to root
- [x] S1.1.2: Add `typecheck` script, rename package to `priority-queue-ticketing`
- [x] S1.1.3: Write `lib/types.ts` + `CONTRACT.md` + `DESIGN.md`

### T1.2: Backend — Agent 2 | status: completed
- [x] S1.2.1: `lib/store.ts` JSON file store + `lib/seed.ts` (2 queue types)
- [x] S1.2.2: `app/api/state`, `queue-types`, `tickets` route handlers
- [x] S1.2.3: `app/api/auth/login|logout` proxy + `lib/auth.ts` + `proxy.ts` gating

### T1.3: Frontend — Agent 1 | status: completed
- [x] S1.3.1: `lib/api-client.ts` typed fetch wrappers
- [x] S1.3.2: `/kiosk` display-only, N panels, polling
- [x] S1.3.3: `/dashboard` admin manage + issue tickets + priority
- [x] S1.3.4: `/operator` protected call-next; `/login` form

### T1.4: QC — Agent 3 (done by Commander, QC agent stalled) | status: completed
- [x] S1.4.1: lint 0 / build 0 / typecheck 0
- [x] S1.4.2: Verified auth gating (307), kiosk read-only, priority ordering, call flips prior to done
- [x] S1.4.3: Fixed login 500 (dummyjson flat payload), Suspense for useSearchParams, proxy rename
