# Rule Engine v2 Slice 02 Smoke (Spellbook Active Toggle)

## Scope
- `src/voice/spellbook.js` is derived from `spellbook-v2`.
- Toggling `active` in v2 spellbook changes runtime/KWS availability.

## Preconditions
- Deploy includes:
  - `src/content/interactions-v2/spellbook-v2.js`
  - `src/voice/spellbook.js`
- Receiver and phone can connect normally.

## Test A: Disable one spell
1. In `src/content/interactions-v2/spellbook-v2.js`, set:
   - target spell `active: false` (example: `orbis`).
2. Deploy/reload receiver and transmitter.
3. Speak target spell multiple times.
4. Expected:
   - Target spell does not trigger KWS spell-detected behavior.
   - Other active spells still work.

## Test B: Re-enable spell
1. Set the same spell back to `active: true`.
2. Deploy/reload.
3. Speak target spell again.
4. Expected:
   - Target spell is recognized/usable again.

## Test C: Validation guard
1. Temporarily set invalid value:
   - `active: "true"` (string) on one spell.
2. Reload receiver.
3. Expected:
   - Startup fails with `Spellbook v2 validation failed: ... active must be boolean`.
4. Revert and confirm startup is clean.

## Test D: Canonical shape/range guard
1. Temporarily set invalid values on one spell:
   - `id: "Rota"` (uppercase),
   - `confidence: 1.5` (out of range),
   - or `onnx: "rota-model"` (invalid shape).
2. Reload receiver.
3. Expected:
   - Startup fails with `Spellbook v2 validation failed: ...`.
4. Revert and confirm startup is clean.

## Pass Criteria
- A and B prove toggle wiring.
- C proves fail-fast schema protection.
