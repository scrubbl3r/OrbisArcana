# Rule Engine V1 Slice 256 Smoke (Internal Axis-Token Nomenclature Lock)

Goal
- Neutralize internal KWS/dispatch naming from `selectedAxisSpell...` to `selectedAxisToken...`.
- Keep runtime contract fields (`axisSpell`) unchanged.
- Preserve compatibility aliases for bridge/panel wiring during transition.

Checks
- Run: `node --input-type=module -e "import('./src/content/spells/validate-spell-runtime-routing-v1.js').then(({validateSpellRuntimeRoutingV1})=>{const e=validateSpellRuntimeRoutingV1(); if(e.length){console.error(e.join('\\n')); process.exit(1);} console.log('slice256-spell-routing-ok');})"`
- Run: `node --input-type=module -e "import('./src/content/spells/validate-spell-schema-integrity-v1.js').then(({validateSpellSchemaIntegrityV1})=>{const e=validateSpellSchemaIntegrityV1(); if(e.length){console.error(e.join('\\n')); process.exit(1);} console.log('slice256-spell-schema-ok');})"`
- Run: `node --input-type=module -e "import('./src/content/spell-rules/validate-rule-engine-v1-config.js').then(({validateRuleEngineV1Config})=>{const e=validateRuleEngineV1Config(); if(e.length){console.error(e.join('\\n')); process.exit(1);} console.log('slice256-validate-ok');})"`
- Run: `node --input-type=module -e "import('./src/runtime/receiver-bootstrap.js').then(()=>console.log('slice256-runtime-ok'))"`

Expected
- `slice256-spell-routing-ok`
- `slice256-spell-schema-ok`
- `slice256-validate-ok`
- `slice256-runtime-ok`

Optional UI Spot Check
- Open flat-spin and select an axis token; confirm wake-window token lighting behavior is unchanged.

Cleanup
- None.
