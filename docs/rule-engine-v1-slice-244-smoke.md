# Rule Engine V1 Slice 244 Smoke (Routing Validator Legacy Fail-Fast)

## Goal
- Add explicit fail-fast guards so runtime routing rejects remaining legacy intent/keys.

## Checks
- Run: `node --input-type=module -e "import('./src/content/spells/validate-spell-runtime-routing-v1.js').then(({validateSpellRuntimeRoutingV1})=>{const e=validateSpellRuntimeRoutingV1(); if(e.length){console.error(e.join('\\n')); process.exit(1);} console.log('slice244-spell-routing-ok');})"`
- Run: `node --input-type=module -e "import('./src/content/spells/validate-spell-schema-integrity-v1.js').then(({validateSpellSchemaIntegrityV1})=>{const e=validateSpellSchemaIntegrityV1(); if(e.length){console.error(e.join('\\n')); process.exit(1);} console.log('slice244-spell-schema-ok');})"`
- Run: `node --input-type=module -e "import('./src/content/spell-rules/validate-rule-engine-v1-config.js').then(({validateRuleEngineV1Config})=>{const e=validateRuleEngineV1Config(); if(e.length){console.error(e.join('\\n')); process.exit(1);} console.log('slice244-validate-ok');})"`
- Run: `node --input-type=module -e "import('./src/runtime/receiver-bootstrap.js').then(()=>console.log('slice244-runtime-ok'))"`

## Expected
- `slice244-spell-routing-ok`
- `slice244-spell-schema-ok`
- `slice244-validate-ok`
- `slice244-runtime-ok`

## Cleanup
- None.
