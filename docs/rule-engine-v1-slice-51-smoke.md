# Rule Engine V1 Slice 51 Smoke Checklist

## Purpose
- Add top-level global default arg overrides:
  - `eventDefaultOverrides`
  - `windowDefaultOverrides`

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Event default override sanity
- In master control, set:
  `eventDefaultOverrides: { grace: { ms: 900 } }`
- Trigger grace event path without per-action `ms` override.
- Confirm resolved grace uses new default.

3) Window default override sanity
- Set:
  `windowDefaultOverrides: { wake_win: { ttlMs: 2400 } }`
- Trigger wake window action without per-action `ttlMs` override.
- Confirm resolved wake window uses new default.

4) Precedence sanity
- Add per-action inline arg (e.g. `ms: 500` or `ttlMs: 2000`).
- Confirm per-action inline value overrides global default override.

5) Validation sanity
- Set unknown ids or non-object override values and confirm config fail-fast.
