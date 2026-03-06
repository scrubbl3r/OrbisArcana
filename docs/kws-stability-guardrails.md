# KWS Stability Guardrails

This document captures the runtime invariants that should not be changed casually.

## Core Invariants
- `openwakeword_browser` is the default and only active KWS backend.
- KWS boots automatically on receiver load (no gesture gate required).
- Watchdog success requires both:
  - audio flow (`aud/frm` progressing), and
  - inference flow (`inf:on` or inference count progressing).
- Token emit cooldown is enforced per token.
- Runtime tuning comes from source defaults + UI apply, not URL params.

## Regression Signals
- `conn:off` while `ctx:running` and `aud/frm` are advancing.
- Persistent `inf:off/0` after warmup.
- Duplicate immediate token prints without cooldown spacing.
- KWS requires gesture/phone interaction before first detection.

## Change Policy
- Prefer extraction/refactor over behavioral changes in the audio/infer data path.
- Any queue/pump optimization must be A/B smoke tested against this checklist:
  - [KWS Regression Checklist](./kws-regression-checklist.md)
- If a change touches worker message protocol (`audio worker <-> backend <-> infer worker`),
  run full spell smoke before merge.

## Rollback Rule
- If a KWS change regresses `conn`/`inf` readiness, revert immediately to last known-good commit,
  then reintroduce the change behind a controlled test slice.
