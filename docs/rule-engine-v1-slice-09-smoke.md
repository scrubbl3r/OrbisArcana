RULE ENGINE V1 - SLICE 09 SMOKE CHECKLIST

Purpose
- Remove hardcoded KWS token groups and derive from active spellbook + routing config.

Quick Smoke (manual)
1) Active toggle propagation
- Set `orbis.active = false`.
- Restart and confirm KWS row/log/ungated token behavior no longer treats `orbis` as active.

2) Class token grouping
- Confirm class-window token handling still works for active class spells (`rota/sanctum/vectus` by default).

3) Flash token grouping
- Confirm top-line flash token behavior still works for active configured flash tokens.

4) Config source check
- Verify these lists are now config-driven:
  - `src/voice/kws/kws-config.js`
  - `src/voice/kws/kws-event-bindings.js`
  - `src/content/spells/spell-runtime-routing-v1.js`
