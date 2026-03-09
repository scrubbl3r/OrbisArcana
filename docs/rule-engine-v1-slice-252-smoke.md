# Rule Engine V1 Slice 252 Smoke (Active Checklist Terminology Neutralization)

Goal
- Neutralize active KWS regression checklist wording from class-centric terms to wake-window token terms.
- Keep historical slice docs untouched as timeline records.

Checks
- Run: `node --input-type=module -e "import('./src/content/spells/validate-spell-runtime-routing-v1.js').then(({validateSpellRuntimeRoutingV1})=>{const e=validateSpellRuntimeRoutingV1(); if(e.length){console.error(e.join('\\n')); process.exit(1);} console.log('slice252-spell-routing-ok');})"`
- Run: `node --input-type=module -e "import('./src/content/spells/validate-spell-schema-integrity-v1.js').then(({validateSpellSchemaIntegrityV1})=>{const e=validateSpellSchemaIntegrityV1(); if(e.length){console.error(e.join('\\n')); process.exit(1);} console.log('slice252-spell-schema-ok');})"`
- Run: `node --input-type=module -e "import('./src/content/spell-rules/validate-rule-engine-v1-config.js').then(({validateRuleEngineV1Config})=>{const e=validateRuleEngineV1Config(); if(e.length){console.error(e.join('\\n')); process.exit(1);} console.log('slice252-validate-ok');})"`
- Run: `node --input-type=module -e "import('./src/runtime/receiver-bootstrap.js').then(()=>console.log('slice252-runtime-ok'))"`

Expected
- `slice252-spell-routing-ok`
- `slice252-spell-schema-ok`
- `slice252-validate-ok`
- `slice252-runtime-ok`

Doc Spot Check
- Open `docs/kws-regression-checklist.md` and confirm section 5 uses wake-window token terminology (no class-window/class-token wording).

Cleanup
- None.
