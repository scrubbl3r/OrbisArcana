# KWS Guardrails

Related index:
- `docs/rule-engine-v2-docs-index.md`

This document captures runtime guardrails that should not be changed casually.

Preflight:
- Run `npm run status:v2` before KWS guardrail validation so v2 health and contracts are confirmed green.

## Core Guardrails
- OpenWakeWord Browser (`openwakeword_browser`) is the only active KWS backend.
- KWS boots automatically on receiver load (no gesture gate required).
- Watchdog success requires both:
  - audio flow (`aud/frm` progressing), and
  - inference flow (`inf:on` or inference count progressing).
- Word token emit cooldown is enforced per word token.
- Runtime tuning comes from source defaults + UI apply, not URL params.

## Regression Signals
- `conn:off` while `ctx:running` and `aud/frm` are advancing.
- Persistent `inf:off/0` after warmup.
- Duplicate immediate word token prints without cooldown spacing.
- KWS requires gesture/phone interaction before first detection.

## Change Policy
- Prefer extraction/refactor over behavioral changes in the audio/infer data path.
- Any queue/pump optimization must be A/B smoke tested against this checklist:
  - [KWS Smoke Checklist](./kws-smoke-checklist.md)
- If a change touches worker message protocol (`audio worker <-> backend <-> infer worker`),
  run the full [KWS Smoke Checklist](./kws-smoke-checklist.md) before merge.

## Rollback Rule
- If a KWS change regresses `conn`/`inf` readiness, revert immediately to last known-good commit,
  then reintroduce the change behind a controlled test slice.
