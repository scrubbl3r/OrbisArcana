# Rule Engine V1 Slice 253 Smoke (Pre-Close Consolidated Gate)

Goal
- Run a consolidated pre-close validation/runtime gate.
- Confirm current neutral contract checkpoints are in place.

Checks
- Run: `node --input-type=module -e "import('./src/content/spells/validate-spell-runtime-routing-v1.js').then(({validateSpellRuntimeRoutingV1})=>{const e=validateSpellRuntimeRoutingV1(); if(e.length){console.error(e.join('\\n')); process.exit(1);} console.log('slice253-spell-routing-ok');})"`
- Run: `node --input-type=module -e "import('./src/content/spells/validate-spell-schema-integrity-v1.js').then(({validateSpellSchemaIntegrityV1})=>{const e=validateSpellSchemaIntegrityV1(); if(e.length){console.error(e.join('\\n')); process.exit(1);} console.log('slice253-spell-schema-ok');})"`
- Run: `node --input-type=module -e "import('./src/content/spell-rules/validate-rule-engine-v1-config.js').then(({validateRuleEngineV1Config})=>{const e=validateRuleEngineV1Config(); if(e.length){console.error(e.join('\\n')); process.exit(1);} console.log('slice253-validate-ok');})"`
- Run: `node --input-type=module -e "import('./src/runtime/receiver-bootstrap.js').then(()=>console.log('slice253-runtime-ok'))"`

Expected
- `slice253-spell-routing-ok`
- `slice253-spell-schema-ok`
- `slice253-validate-ok`
- `slice253-runtime-ok`

Contract Spot Checks
- KWS runtime config uses `expectedAxisTokenByAxis`.
- KWS panel fail-fast rejects legacy key `axisSpellByAxis`.
- Cast action naming uses `aoe_axis` and rejects legacy `aoe_school` via validators.
- Routing validator rejects legacy intents/keys (`spell.school_select`, `spell.class_select`, `school`, `classKey`).

Cleanup
- None.
