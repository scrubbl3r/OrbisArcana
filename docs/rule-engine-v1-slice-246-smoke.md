# Rule Engine V1 Slice 246 Smoke (Remove Axis AOE Legacy Alias)

Goal
- Remove temporary compatibility alias for legacy axis AOE naming.
- Keep only canonical neutral naming: `aoe_axis` + `play_axis_aoe`.

Checks
- Run: `node --input-type=module -e "import('./src/content/spells/validate-spell-runtime-routing-v1.js').then(({validateSpellRuntimeRoutingV1})=>{const e=validateSpellRuntimeRoutingV1(); if(e.length){console.error(e.join('\\n')); process.exit(1);} console.log('slice246-spell-routing-ok');})"`
- Run: `node --input-type=module -e "import('./src/content/spells/validate-spell-schema-integrity-v1.js').then(({validateSpellSchemaIntegrityV1})=>{const e=validateSpellSchemaIntegrityV1(); if(e.length){console.error(e.join('\\n')); process.exit(1);} console.log('slice246-spell-schema-ok');})"`
- Run: `node --input-type=module -e "import('./src/content/spell-rules/validate-rule-engine-v1-config.js').then(({validateRuleEngineV1Config})=>{const e=validateRuleEngineV1Config(); if(e.length){console.error(e.join('\\n')); process.exit(1);} console.log('slice246-validate-ok');})"`
- Run: `node --input-type=module -e "import('./src/runtime/receiver-bootstrap.js').then(()=>console.log('slice246-runtime-ok'))"`

Expected
- `slice246-spell-routing-ok`
- `slice246-spell-schema-ok`
- `slice246-validate-ok`
- `slice246-runtime-ok`

Optional Gameplay Spot Check
- Cast `rota` under each axis selection and confirm axis-driven AOE still behaves as before.

Cleanup
- None.
