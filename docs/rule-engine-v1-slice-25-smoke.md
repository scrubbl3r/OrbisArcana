# Rule Engine V1 Slice 25 Smoke Checklist

## Purpose
- Migrate routing/runtime intent names from legacy `school/class` to neutral `axis/wake_window` while keeping dispatch compatibility.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Axis + wake-window flow
- Open flat-spin window and speak an axis spell token.
- Then speak a wake-window spell token.
- Confirm normal load/cast behavior remains unchanged.

3) Legacy compatibility sanity
- Confirm no regressions if any legacy-produced intent strings appear in events (dispatch still accepts both forms).
