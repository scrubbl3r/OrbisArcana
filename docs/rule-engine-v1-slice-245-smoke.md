# Rule Engine V1 Slice 245 Smoke (Neutralize Axis AOE Action Naming)

Goal
- Promote neutral cast action naming for axis-driven AOE behavior.
- Canonical action id/key become `aoe_axis` / `play_axis_aoe`.
- Keep temporary compatibility alias for `aoe_school` to avoid regressions during transition.

Checks
- Run: `node --input-type=module -e "import('./src/content/spells/validate-spell-runtime-routing-v1.js').then(({validateSpellRuntimeRoutingV1})=>{const e=validateSpellRuntimeRoutingV1(); if(e.length){console.error(e.join('\\n')); process.exit(1);} console.log('slice245-spell-routing-ok');})"`
- Run: `node --input-type=module -e "import('./src/content/spells/validate-spell-schema-integrity-v1.js').then(({validateSpellSchemaIntegrityV1})=>{const e=validateSpellSchemaIntegrityV1(); if(e.length){console.error(e.join('\\n')); process.exit(1);} console.log('slice245-spell-schema-ok');})"`
- Run: `node --input-type=module -e "import('./src/content/spell-rules/validate-rule-engine-v1-config.js').then(({validateRuleEngineV1Config})=>{const e=validateRuleEngineV1Config(); if(e.length){console.error(e.join('\\n')); process.exit(1);} console.log('slice245-validate-ok');})"`
- Run: `node --input-type=module -e "import('./src/runtime/receiver-bootstrap.js').then(()=>console.log('slice245-runtime-ok'))"`

Expected
- `slice245-spell-routing-ok`
- `slice245-spell-schema-ok`
- `slice245-validate-ok`
- `slice245-runtime-ok`

Optional Gameplay Spot Check
- Cast `rota` under each axis selection and confirm AOE variant behavior is unchanged.

Cleanup
- None.
