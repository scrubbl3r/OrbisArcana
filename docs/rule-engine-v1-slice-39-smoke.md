RULE ENGINE V1 - SLICE 39 SMOKE CHECKLIST

Purpose
- Make action inline args generic: any non-structural action key is treated as an override arg.

Quick Smoke (manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Generic event arg sanity
- Add inline args to an event action (for example `range`, `damage`, `state`).
- Confirm schema validation passes (except invalid `ms` values).

3) Wake window guardrail sanity
- Confirm `wake_win` still rejects `ms` and expects `ttlMs` semantics.

4) Runtime normalization sanity
- Inspect normalized rule action overrides and confirm inline keys are present.
