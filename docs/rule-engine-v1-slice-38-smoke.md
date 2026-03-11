# Rule Engine V1 Slice 38 Smoke Checklist

## Purpose
- Make spell schema integrity validation default to `RULE_ENGINE_V1_MASTER_CONFIG` (not split rule/event modules).

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Integrity path sanity
- Confirm integrity validation passes without requiring split rule/event imports.

3) Failure probe
- Temporarily remove an event definition or runtime binding used by a configured rule event.
- Restart and confirm integrity fail-fast.
- Revert and confirm recovery.

4) Behavior sanity
- Trigger a known rule and confirm behavior unchanged.
