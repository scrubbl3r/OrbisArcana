# Rule Engine V1 Slice 257 Smoke (Nugget Handle Canonization Layer)

Goal
- Add ALLCAPS nugget-handle authoring support while preserving runtime behavior.
- Normalize handles into canonical runtime ids during rule build/validation.

Implemented Handle Layer
- Condition type handles: `SPELL`, `GESTURE`, `ORB_STATE`, `SIGNAL`
- Action type handles: `WAKE_WIN`, `EVENT`
- Signal id handles:
  - `Y_SPIN`
  - `FSPIN_X`, `FSPIN_Y`, `FSPIN_Z`
  - `UD_SHAKE`, `LR_SHAKE`, `FB_SHAKE`
- Event id handles:
  - `ELECTRIC_AOE`, `GRACE`, `ORB_STATE`
- Window id handle:
  - `WAKE_WIN`

Checks
- Run: `node --input-type=module -e "import('./src/content/spells/validate-spell-runtime-routing-v1.js').then(({validateSpellRuntimeRoutingV1})=>{const e=validateSpellRuntimeRoutingV1(); if(e.length){console.error(e.join('\\n')); process.exit(1);} console.log('slice257-spell-routing-ok');})"`
- Run: `node --input-type=module -e "import('./src/content/spells/validate-spell-schema-integrity-v1.js').then(({validateSpellSchemaIntegrityV1})=>{const e=validateSpellSchemaIntegrityV1(); if(e.length){console.error(e.join('\\n')); process.exit(1);} console.log('slice257-spell-schema-ok');})"`
- Run: `node --input-type=module -e "import('./src/content/spell-rules/validate-rule-engine-v1-config.js').then(({validateRuleEngineV1Config})=>{const e=validateRuleEngineV1Config(); if(e.length){console.error(e.join('\\n')); process.exit(1);} console.log('slice257-validate-ok');})"`
- Run: `node --input-type=module -e "import('./src/runtime/receiver-bootstrap.js').then(()=>console.log('slice257-runtime-ok'))"`

Expected
- `slice257-spell-routing-ok`
- `slice257-spell-schema-ok`
- `slice257-validate-ok`
- `slice257-runtime-ok`

Spot Checks
- `src/content/spell-rules/spell-rules-v1.js` uses ALLCAPS handles and still validates.
- `src/content/spell-rules/signal-definitions-v1.js` includes canonical gesture ids for `fspin_*` and `*_shake`.

Cleanup
- None.
