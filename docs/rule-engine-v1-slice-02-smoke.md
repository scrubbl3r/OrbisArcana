# RULE ENGINE V1 - SLICE 02 SMOKE CHECKLIST

## Purpose
- Wire Rule Engine v1 schema loading/validation into bootstrap.
- Expected gameplay impact for this slice: none.

## Quick Smoke (Manual)
1) App boot
- Start receiver normally.
- Expect no init failure and normal game loop startup.

2) Existing spell behavior
- Speak `orbis`, then `domus`.
- Expect behavior unchanged.

3) Schema validation gate
- Temporarily break `src/content/spell-rules/spell-rules-v1.js` by changing one action id to an unknown event id.
- Restart receiver.
- Expect bootstrap init failure with a Rule Engine v1 schema validation error.
- Revert the change and confirm startup recovers.

What changed in this slice
- Receiver bootstrap now imports rule-schema modules.
- Rule schema is validated during hydration.
- Validated schema snapshot is exposed via receiver context for future cutover slices.
