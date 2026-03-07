RULE ENGINE V1 - SLICE 20 SMOKE CHECKLIST

Purpose
- Remove retired `spell-decision-tree` module now that runtime uses routing/rules config.

Quick Smoke (manual)
1) Startup check
- Start receiver and confirm normal boot.

2) Voice flow sanity
- Trigger wake + spell detection path.
- Confirm no missing-module errors and normal token/spell events.

3) Import audit
- Confirm no source file imports `src/voice/spell-decision-tree.js`.
