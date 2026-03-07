RULE ENGINE V1 - SLICE 26 SMOKE CHECKLIST

Purpose
- Introduce neutral axis-selection event contract (`voice.axis_selected`) while keeping legacy `voice.school_selected` compatibility.

Quick Smoke (manual)
1) Boot sanity
- Start receiver and confirm normal startup.

2) Axis token flow
- Open flat-spin and speak an axis token.
- Confirm axis selection UI behavior still updates correctly.

3) Wake-window follow-up
- Speak a wake-window token after axis selection.
- Confirm load/cast flow remains unchanged.

4) Contract compatibility
- Verify both events are emitted on axis selection:
  - `voice.axis_selected` (new)
  - `voice.school_selected` (legacy)
