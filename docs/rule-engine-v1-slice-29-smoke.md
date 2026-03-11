# RULE ENGINE V1 - SLICE 29 SMOKE CHECKLIST

## Purpose
- Add author-facing rule shorthand support:
  - `on` condition types: `spell`, `gesture`, `orb_state` (auto-resolved to signal IDs)
  - inline action args: `ttlMs`, `ms`, `state` (merged into runtime overrides)

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Rule match sanity
- Trigger rota + y-spin + charged condition sequence.
- Confirm rule still matches and actions execute as before.

3) Inline arg sanity
- Confirm wake window uses inline `ttlMs` from rule action.
- Confirm grace event uses inline `ms` from rule action.

4) Backward compatibility sanity
- Existing rules using explicit `signal` conditions and `overrides` should still validate and run.
