# Rule Engine V1 Slice 249 Smoke (Drop KWS Legacy Axis Map Fallback)

Goal
- Remove temporary KWS panel fallback for legacy key `axisSpellByAxis`.
- Keep only canonical neutral key `expectedAxisTokenByAxis`.

Checks
- Run: `node --input-type=module -e "import('./src/content/spells/validate-spell-runtime-routing-v1.js').then(({validateSpellRuntimeRoutingV1})=>{const e=validateSpellRuntimeRoutingV1(); if(e.length){console.error(e.join('\\n')); process.exit(1);} console.log('slice249-spell-routing-ok');})"`
- Run: `node --input-type=module -e "import('./src/content/spells/validate-spell-schema-integrity-v1.js').then(({validateSpellSchemaIntegrityV1})=>{const e=validateSpellSchemaIntegrityV1(); if(e.length){console.error(e.join('\\n')); process.exit(1);} console.log('slice249-spell-schema-ok');})"`
- Run: `node --input-type=module -e "import('./src/content/spell-rules/validate-rule-engine-v1-config.js').then(({validateRuleEngineV1Config})=>{const e=validateRuleEngineV1Config(); if(e.length){console.error(e.join('\\n')); process.exit(1);} console.log('slice249-validate-ok');})"`
- Run: `node --input-type=module -e "import('./src/runtime/receiver-bootstrap.js').then(()=>console.log('slice249-runtime-ok'))"`

Expected
- `slice249-spell-routing-ok`
- `slice249-spell-schema-ok`
- `slice249-validate-ok`
- `slice249-runtime-ok`

Optional Gameplay Spot Check
- Open flat-spin on each axis and confirm expected axis token highlighting still works.

Cleanup
- None.
