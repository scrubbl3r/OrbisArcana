# Rule Engine V2 Slice 01 Smoke

## Scope
- V2 schema files exist.
- V2 adapter exists.
- Bootstrap can switch rule source with a feature flag.
- Spellbook V2 validation runs fail-fast at startup.

## Preconditions
- Deploy branch includes:
  - `src/content/interactions-v2/*`
  - `src/runtime/receiver-bootstrap.js`
- Browser DevTools console open on receiver page.

## Test A: Default behavior unchanged (flag OFF)
1. In `src/content/interactions-v2/interactions-v2.js`, keep:
   - `INTERACTIONS_V2_BOOTSTRAP.useInReceiverBootstrap: false`
2. Reload receiver.
3. Confirm console contains:
   - `[receiver-bootstrap] rule source: RULE_ENGINE_V1_MASTER_CONTROL`
4. Confirm on-screen readout shows:
   - `Rules: V1 master`
5. Run normal gameplay smoke (KWS + spell cast + orb response).
6. Expected:
   - Behavior matches current baseline (no functional drift from V1 path).

## Test B: V2 adapter path active (flag ON)
1. Set:
   - `INTERACTIONS_V2_BOOTSTRAP.useInReceiverBootstrap: true`
2. Reload receiver.
3. Confirm console contains:
   - `[receiver-bootstrap] rule source: INTERACTIONS_V2(adapter)`
4. Confirm on-screen readout shows:
   - `Rules: V2 adapter`
5. Trigger the sample V2 rule chain condition:
   - spell `rota` + `Y_SPIN` + `orb_state charged`
6. Expected:
   - No startup schema errors.
   - Rule engine remains operational through adapted V2 rules.

## Test C: Spellbook V2 fail-fast validation
1. In `src/content/interactions-v2/spellbook-v2.js`, temporarily duplicate one `id` in `spells`.
2. Reload receiver.
3. Expected:
   - Startup throws:
     - `Spellbook v2 validation failed: ...`
4. Revert the temporary duplicate and reload.
5. Expected:
   - Startup clean again.

## Pass Criteria
- Test A passes.
- Test B passes.
- Test C fail-fast and recovery both pass.
