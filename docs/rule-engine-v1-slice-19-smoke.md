# Rule Engine V1 Slice 19 Smoke Checklist

## Purpose
- Add cross-file spell schema integrity validation at startup.

## Quick Smoke (Manual)
1) Normal boot
- Start receiver with current config.
- Confirm normal startup.

2) Integrity failure probe (missing runtime binding)
- Temporarily remove one event binding from `event-runtime-bindings-v1.js` (for an event used in rules).
- Restart receiver.
- Expect startup failure: `Spell schema integrity validation failed`.
- Revert and confirm recovery.

3) Integrity failure probe (unknown wake/class id)
- Temporarily add invalid id to one routing list (`WAKE_SPELL_IDS` or `CLASS_SPELL_IDS`).
- Restart and confirm fail-fast error.
- Revert and confirm recovery.
