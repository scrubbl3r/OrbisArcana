# Rule Engine V1 Slice 251 Smoke (KWS Legacy Config Key Fail-Fast)

Goal
- Enforce neutral KWS config contract by rejecting legacy key `axisSpellByAxis` at panel construction.
- Canonical key remains `expectedAxisTokenByAxis`.

Checks
- Run: `node --input-type=module -e "import('./src/content/spells/validate-spell-runtime-routing-v1.js').then(({validateSpellRuntimeRoutingV1})=>{const e=validateSpellRuntimeRoutingV1(); if(e.length){console.error(e.join('\\n')); process.exit(1);} console.log('slice251-spell-routing-ok');})"`
- Run: `node --input-type=module -e "import('./src/content/spells/validate-spell-schema-integrity-v1.js').then(({validateSpellSchemaIntegrityV1})=>{const e=validateSpellSchemaIntegrityV1(); if(e.length){console.error(e.join('\\n')); process.exit(1);} console.log('slice251-spell-schema-ok');})"`
- Run: `node --input-type=module -e "import('./src/content/spell-rules/validate-rule-engine-v1-config.js').then(({validateRuleEngineV1Config})=>{const e=validateRuleEngineV1Config(); if(e.length){console.error(e.join('\\n')); process.exit(1);} console.log('slice251-validate-ok');})"`
- Run: `node --input-type=module -e "import('./src/runtime/receiver-bootstrap.js').then(()=>console.log('slice251-runtime-ok'))"`

Expected
- `slice251-spell-routing-ok`
- `slice251-spell-schema-ok`
- `slice251-validate-ok`
- `slice251-runtime-ok`

Optional Negative Check
- Construct KWS panel constants with `axisSpellByAxis` and confirm it throws `kws_panel_legacy_config_key:axisSpellByAxis`.

Cleanup
- None.
