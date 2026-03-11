# RULE ENGINE V1 - SLICE 03 SMOKE CHECKLIST

## Purpose
- Add read-only rule preview runtime.
- Expected gameplay impact: none (no rule actions execute).

## Quick Smoke (Manual)
1) Boot receiver
- Expect normal startup.

2) Wake/cast baseline
- Speak `orbis`, then `domus`.
- Expect unchanged behavior.

3) Preview signal path (non-gameplay)
- Trigger any configured signal path (for example a `voice.spell_detected` token flow).
- Expect no gameplay side effects from rules.
- Optional: inspect `mvp.ruleEngineV1PreviewSystem.snapshot()` in console and verify `seenSignalIds` updates.

4) Validation safety
- Temporarily set a signal `sourceEvent` to empty in `signal-definitions-v1.js`.
- Restart and expect schema validation failure.
- Revert and confirm startup recovers.
