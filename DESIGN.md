# DESIGN.md — Antrian Tiket

Direction for the priority-queue ticketing UI.

## Identity

- Product: "Antrian Tiket", an internal queue-management tool for a service counter
  (bank/klinik-style). Three surfaces: admin dashboard, public kiosk display, operator panel.
- Personality: calm, legible, operational. It is a working tool seen on a wall-mounted
  kiosk and on staff screens, not a marketing page.
- Dial: ENERGY 1 / RHYTHM 2 / MOTION 1.

## Palette (2 core + 1 accent + neutral base)

- Core: `ink` slate-900 (text/surfaces), `paper` slate-50 (base background).
- Core: `steel` slate-600/700 (secondary text, borders).
- Accent: `signal` amber-500 (only for the live/called number and the primary call action).
- Status semantics (functional, not decoration): emerald = selesai/done, amber = dipanggil/called,
  slate = menunggu/waiting, red = dilewati/skipped.
- No gradients. No glow. Status color only ever marks real ticket state.

## Typography

- System UI stack for body (fast, neutral, legible on kiosk).
- Tabular numerals for all ticket numbers so digits do not jump (kiosk legibility).

## Layout

- Kiosk: horizontal grid of equal panels, one per active queue type, number large and centered.
- Dashboard/Operator: two-column on desktop (controls / data), single column on mobile.
- Radius: 2 levels (6px controls, 10px panels). No pills except status chips.

## Reasons (one line each)

- Amber accent: the "now calling" number is the single most important thing on every screen,
  so one warm color is reserved for it and the call action; everything else stays slate.
- Tabular numerals: called numbers change every few seconds; proportional digits shift layout.
- slate/amber over blue-purple: the stock AI gradient reads as unbranded; an operational tool
  wants a quiet neutral base with one functional signal color.
