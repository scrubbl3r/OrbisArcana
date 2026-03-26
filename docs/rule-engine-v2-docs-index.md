# Rule Engine v2 Docs Index

Preflight:
- Run `npm run status:v2` before edits and smokes to confirm current v2 health and contracts are green.

## Quick Start
1. Edit behavior rules in `src/content/interactions-v2/dream-config-v2.js`.
2. Edit word inventory in `src/content/interactions-v2/wordbook-v2.js`.
3. Run `npm run status:v2` for a quick current-state summary.
4. Run `npm run ready:v2` for validation + health checks.
5. Use **Before Push Checklist** below for push-time smoke requirements.

## Troubleshooting Quick Map
- `KWS: init failed` or word token detection stalls:
  - [KWS Guardrails](./kws-guardrails.md)
  - [KWS Smoke Checklist](./kws-smoke-checklist.md)
- `Rules: unknown` or fallback/readout confusion:
  - [Rule Engine Smoke](./rule-engine-smoke.md)
  - [Rule Engine Compatibility](./rule-engine-compatibility.md)
- Validation failures:
  - [Rule Engine Authoring](./rule-engine-authoring.md)
  - See **Generated Artifacts Quick Links** -> `Effective Interactions Snapshot`.

## File Ownership Map
- Authoring sources (edit directly):
  - `src/content/interactions-v2/dream-config-v2.js`
  - `src/content/interactions-v2/wordbook-v2.js`
- Compiled view (generated at runtime/module load; avoid hand edits):
  - `src/content/interactions-v2/orchestrator-v2.js`
- Runtime integration/config surfaces (edit only for runtime/system work):
  - `src/content/spell-rules/rule-engine-master-control.js`
  - `src/content/spell-rules/validate-rule-engine-config.js`
  - `src/content/spells/runtime-spells.js`
  - `src/runtime/receiver-bootstrap.js`
  - `src/voice/wordbook.js`
- Generated artifacts (do not hand-edit):
  - `docs/effective-interactions-v2.snapshot.json`
  - `docs/master-control-v2.md`
  - `docs/master-control-v2.json`
  - `docs/master-control-v2.authoring.json`
  - `docs/rule-engine-v2.health.json`
  - `docs/rule-engine-v2.status.json`
  - `docs/rule-engine-v2.milestone-smoke.json`
  - `docs/rule-engine-v2.milestone-history.jsonl`
  - `docs/rule-engine-v2.milestone-trend.json`

## Command Quick Reference
- `npm run pre-smoke:v2`
  - Validates authoring inputs and refreshes effective snapshot.
- `npm run doctor:v2`
  - Summarizes runtime health into `docs/rule-engine-v2.health.json`.
- `npm run status:v2`
  - Prints current v2 status summary and refreshes `docs/rule-engine-v2.status.json`.
- `npm run ready:v2`
  - Enforces health gates and fails fast on invalid config.
- `npm run smoke:batch:v2`
  - Runs focused automated smoke cases.
- `npm run smoke:milestone:v2`
  - Runs `ready:v2` + `smoke:batch:v2` and updates trend/history artifacts.

## Smoke Packs
- Quick automated pack (fast confidence):
  1. `npm run status:v2`
  2. `npm run ready:v2`
  3. `npm run smoke:batch:v2`
- Milestone pack (before push):
  1. `npm run smoke:milestone:v2`
  2. `npm run status:v2`
- Human gameplay pack (manual confidence):
  - See **Troubleshooting Quick Map**, `KWS: init failed or word token detection stalls`.
  - Suggested exemplar checks: `orbis -> domus`, `orbis -> electrum -> rota`, `spin:y + globe_loaded -> pyro -> rota`, `shake:FB`

## Before Push Checklist
1. Authoring edits only in SSOT files (`dream-config-v2.js`, `wordbook-v2.js`) unless doing intentional plumbing.
2. `npm run status:v2` passes (quick current-state summary).
3. `npm run ready:v2` passes.
4. `npm run smoke:milestone:v2` passes.
5. If KWS-related changes were made, use **Troubleshooting Quick Map**, `KWS: init failed or word token detection stalls`.
6. Confirm generated artifacts refreshed (see **File Ownership Map**, **Generated artifacts (do not hand-edit)**).

## Safe Rollback Verification Workflow
1. Create a dedicated fix/test branch from branch tip.
2. Move that branch to a target commit SHA and push it.
3. Validate online behavior from the fix/test branch deployment.
4. Keep original branch untouched while validating target SHAs.
5. Promote only known-good commits back into active development.

## Glossary (v2)
- `signal`: normalized trigger identity matched from source events (for example `spell.rota`, `spin.y`, `shake.fb`).
- `rule`: condition/action bundle with `on` and `then`.
- `wake_win`: legacy runtime label for an opened window with an allowlist and TTL.
- `event`: action that dispatches a named runtime effect/action binding.
- `overrides`: per-instance action args that override defaults for that action execution.
- `projection_only`: runtime mode where projected rules from v2 authoring are the active execution source.

## Common Edit Recipes
- Toggle a word on/off:
  - edit `src/content/interactions-v2/wordbook-v2.js` -> set `active: true|false`.
- Add a new interaction chain:
  - edit `src/content/interactions-v2/dream-config-v2.js` -> add a `rules[]` entry with `on` + `open` + `trigger`.
- Change default behavior for all instances of an event/window:
  - edit `src/content/spell-rules/rule-engine-master-control.js` -> default/override maps.
- Tune one event instance without global changes:
  - in an action, use `overrides` (for example `{ type: "event", id: "grace", overrides: { ms: 900 } }`).

## FAQ
- Why did my runtime/generated docs change after checks?
  - See **Command Quick Reference**; those commands regenerate snapshot/master-control/health artifacts by design.
- What should I avoid editing directly?
  - See **File Ownership Map** -> **Generated artifacts (do not hand-edit)**.

## Canonical Handle Naming
- Prefer canonical ALLCAPS handles for shared entity IDs where available.
- Source of truth for handle constants:
  - `src/content/interactions-v2/entity-handles-v2.js`
- Typical examples:
  - gestures: `SPIN_X`, `SPIN_Y`, `SPIN_Z`
  - shakes: `SHAKE_FB`, `SHAKE_LR`, `SHAKE_UD`
  - windows/actions: `WAKE_WIN`
- Keep authoring IDs stable and reuse handles to avoid string drift across rules.

## Schema References
- [Interactions Schema](./interactions-schema.md)
- [Master Control Schema](./master-control-schema.md)
- [Orchestrator v2 Schema (Draft)](./orchestrator-v2-schema.md)
- [Orchestrator v2 Validator Checklist (Draft)](./orchestrator-v2-validator-checklist.md)

## Generated Artifacts Quick Links
- [Effective Interactions Snapshot](./effective-interactions-v2.snapshot.json)
- [Generated Master Control (Markdown)](./master-control-v2.md)
- [Generated Master Control (JSON)](./master-control-v2.json)
- [Generated Master Control (Authoring JSON)](./master-control-v2.authoring.json)
- [Health Report](./rule-engine-v2.health.json)
- [Status Snapshot](./rule-engine-v2.status.json)
- [Milestone Smoke Report](./rule-engine-v2.milestone-smoke.json)
- [Milestone History Log](./rule-engine-v2.milestone-history.jsonl)
- [Milestone Trend Summary](./rule-engine-v2.milestone-trend.json)
