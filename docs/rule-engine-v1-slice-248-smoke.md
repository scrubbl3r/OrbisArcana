# Rule Engine V1 Slice 248 Smoke (Neutral KWS Axis-Token Map Key)

Goal
- Rename KWS runtime config key `axisSpellByAxis` to neutral `expectedAxisTokenByAxis`.
- Keep backward compatibility in panel controller by accepting the legacy key when present.

Checks
- Run: `node --input-type=module -e "import('./src/content/spells/validate-spell-runtime-routing-v1.js').then(({validateSpellRuntimeRoutingV1})=>{const e=validateSpellRuntimeRoutingV1(); if(e.length){console.error(e.join('\\n')); process.exit(1);} console.log('slice248-spell-routing-ok');})"`
- Run: `node --input-type=module -e "import('./src/content/spells/validate-spell-schema-integrity-v1.js').then(({validateSpellSchemaIntegrityV1})=>{const e=validateSpellSchemaIntegrityV1(); if(e.length){console.error(e.join('\\n')); process.exit(1);} console.log('slice248-spell-schema-ok');})"`
- Run: `node --input-type=module -e "import('./src/content/spell-rules/validate-rule-engine-v1-config.js').then(({validateRuleEngineV1Config})=>{const e=validateRuleEngineV1Config(); if(e.length){console.error(e.join('\\n')); process.exit(1);} console.log('slice248-validate-ok');})"`
- Run: `node --input-type=module -e "import('./src/runtime/receiver-bootstrap.js').then(()=>console.log('slice248-runtime-ok'))"`

Expected
- `slice248-spell-routing-ok`
- `slice248-spell-schema-ok`
- `slice248-validate-ok`
- `slice248-runtime-ok`

Optional Gameplay Spot Check
- Open flat-spin on each axis and confirm the panel still lights the expected axis token.

Cleanup
- None.
