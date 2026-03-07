RULE ENGINE V1 - SLICE 30 SMOKE CHECKLIST

Purpose
- Allow `wake_win` actions to omit `id`; defaults to `wake_win` during validation/runtime normalization.

Quick Smoke (manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Rule schema sanity
- Use a rule action `{ type: "wake_win", spells: [...], ttlMs: 2000 }` with no `id`.
- Confirm schema validation passes.

3) Runtime normalization sanity
- Inspect normalized rule actions in preview runtime.
- Confirm wake window action id resolves to `wake_win` automatically.

4) Behavior sanity
- Trigger rule and confirm wake window opens with expected ttl.
