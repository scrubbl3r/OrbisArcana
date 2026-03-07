RULE ENGINE V1 - SLICE 75 SMOKE CHECKLIST

Purpose
- Add per-source-event debounce tuning via `sourceEventDebounceOverrides`.

Quick Smoke (manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Override sanity
- Keep `execution.sourceEventDebounceMs: 0`.
- Set `sourceEventDebounceOverrides: { "voice.spell_detected": 200 }`.
- Restart and confirm repeated `voice.spell_detected` payloads inside 200ms are ignored.

3) Fallback sanity
- Remove override and set `execution.sourceEventDebounceMs: 200`.
- Confirm debounce still applies via global fallback.

4) Validation sanity
- Set non-numeric/negative override value and confirm fail-fast.
- Set unknown source event in `sourceEventDebounceOverrides` and confirm fail-fast.
