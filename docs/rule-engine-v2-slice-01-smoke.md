# Rule Engine v2 Slice 01 Smoke

## Scope
- v2 schema files exist.
- v2 adapter exists.
- Bootstrap is v2-required (`useInReceiverBootstrap` must remain `true`).
- Spellbook v2 validation runs fail-fast at startup.

## Preconditions
- Deploy branch includes:
  - `src/content/interactions-v2/*`
  - `src/runtime/receiver-bootstrap.js`
- Browser DevTools console open on receiver page.

## Test A: Guardrail when bootstrap is disabled (temporary negative test)
1. In `src/content/interactions-v2/interactions-v2.js`, keep:
   - `INTERACTIONS_V2_BOOTSTRAP.useInReceiverBootstrap: false`
2. Reload receiver.
3. Confirm console contains:
   - `[receiver-bootstrap] rule source: interactions_bootstrap_disabled`
4. Confirm on-screen readout shows:
   - `Rules: V2 bootstrap disabled (safe disabled)`
5. Run normal gameplay smoke (KWS + spell cast + orb response).
6. Expected:
   - Rule engine stays safely disabled (no legacy rule-source fallback).

## Test B: v2 adapter path active (flag ON)
1. Set:
   - `INTERACTIONS_V2_BOOTSTRAP.useInReceiverBootstrap: true`
2. Reload receiver.
3. Confirm console contains:
   - `[receiver-bootstrap] rule source: interactions_adapter`
4. Confirm on-screen readout shows:
   - `Rules: V2 adapter`
5. Trigger the sample v2 rule chain condition:
   - spell `rota` + `Y_SPIN` + `orb_state charged`
6. Expected:
   - No startup schema errors.
   - Rule engine remains operational through adapted v2 rules.

## Test C: Spellbook v2 fail-fast validation
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
