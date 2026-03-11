# Rule Engine V1 Slice 43 Smoke Checklist

## Purpose
- Support `then` shorthand as a single action object (`then: { ... }`) in addition to array form.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Shorthand authoring sanity
- Create a rule with `then` as a single object (not array), e.g. `then: { type: "event", id: "grace", ms: 450 }`.
- Confirm schema validation passes.

3) Runtime normalization sanity
- Confirm normalized actions contains exactly one action with expected args.

4) Backward compatibility sanity
- Existing rules using `then: [ ... ]` still validate and execute unchanged.
