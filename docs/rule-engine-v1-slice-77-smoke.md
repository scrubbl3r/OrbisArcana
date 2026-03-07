RULE ENGINE V1 - SLICE 77 SMOKE CHECKLIST

Purpose
- Add centralized signal condition patching via `signalWhereOverrides`.

Quick Smoke (manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Condition override sanity
- Set, for example:
  `signalWhereOverrides: { "orb_state.charged": { gte: 100 } }`
- Restart and confirm the rule requiring that signal now needs stronger condition match.

3) Merge sanity
- Override only one field (for example `gte`) and confirm other `where` fields remain intact.

4) Validation sanity
- Set non-object override value and confirm fail-fast.
- Set unknown signal id and confirm fail-fast.
- Set empty `path` when provided and confirm fail-fast.
