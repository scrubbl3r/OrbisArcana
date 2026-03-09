# Rule Engine V1 Slice 247 Smoke (Fail-Fast on Legacy Axis AOE Names)

Goal
- Prevent legacy axis AOE aliases from silently returning in content.
- Add schema-integrity fail-fast checks for:
  - legacy castActionId `aoe_school`
  - legacy handlerKey `play_school_aoe`

Checks
- Run: `node --input-type=module -e "import('./src/content/spells/validate-spell-runtime-routing-v1.js').then(({validateSpellRuntimeRoutingV1})=>{const e=validateSpellRuntimeRoutingV1(); if(e.length){console.error(e.join('\\n')); process.exit(1);} console.log('slice247-spell-routing-ok');})"`
- Run: `node --input-type=module -e "import('./src/content/spells/validate-spell-schema-integrity-v1.js').then(({validateSpellSchemaIntegrityV1})=>{const e=validateSpellSchemaIntegrityV1(); if(e.length){console.error(e.join('\\n')); process.exit(1);} console.log('slice247-spell-schema-ok');})"`
- Run: `node --input-type=module -e "import('./src/content/spell-rules/validate-rule-engine-v1-config.js').then(({validateRuleEngineV1Config})=>{const e=validateRuleEngineV1Config(); if(e.length){console.error(e.join('\\n')); process.exit(1);} console.log('slice247-validate-ok');})"`
- Run: `node --input-type=module -e "import('./src/runtime/receiver-bootstrap.js').then(()=>console.log('slice247-runtime-ok'))"`

Expected
- `slice247-spell-routing-ok`
- `slice247-spell-schema-ok`
- `slice247-validate-ok`
- `slice247-runtime-ok`

Cleanup
- None.
