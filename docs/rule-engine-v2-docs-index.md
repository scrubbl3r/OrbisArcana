# Rule Engine v2 Docs Index

## Quick Start
1. Edit behavior rules in `src/content/interactions-v2/interactions-v2.js`.
2. Edit wake-word inventory in `src/content/interactions-v2/spellbook-v2.js`.
3. Run `npm run ready:v2` for validation + health checks.
4. Run `npm run smoke:milestone:v2` before push.

## Troubleshooting Quick Map
- `KWS: init failed` or token detection stalls:
  - [KWS Guardrails](./kws-guardrails.md)
  - [KWS Smoke Checklist](./kws-smoke-checklist.md)
- `Rules: unknown` or fallback/readout confusion:
  - [Rule Engine Smoke](./rule-engine-smoke.md)
  - [Rule Engine Compatibility](./rule-engine-compatibility.md)
- Validation or projection drift failures:
  - [Rule Engine Authoring](./rule-engine-authoring.md)
  - [Effective Interactions Snapshot](./effective-interactions-v2.snapshot.json)

## File Ownership Map
- Authoring sources (edit directly):
  - `src/content/interactions-v2/interactions-v2.js`
  - `src/content/interactions-v2/spellbook-v2.js`
- Runtime bridge/config surfaces (edit only for plumbing/migration):
  - `src/content/spell-rules/rule-engine-master-control.js`
  - `src/runtime/receiver-bootstrap.js`
  - `src/voice/spellbook.js`
- Generated artifacts (do not hand-edit):
  - `docs/effective-interactions-v2.snapshot.json`
  - `docs/master-control-v2.md`
  - `docs/master-control-v2.json`
  - `docs/master-control-v2.authoring.json`
  - `docs/rule-engine-v2.health.json`
  - `docs/rule-engine-v2.milestone-smoke.json`
  - `docs/rule-engine-v2.milestone-trend.json`
- Historical logs/reference:
  - `docs/rule-engine-v2-slice-*.md`
  - `docs/rule-engine-v1-slice-*.md`

## Command Quick Reference
- `npm run pre-smoke:v2`
  - Validates authoring inputs and refreshes effective snapshot.
- `npm run doctor:v2`
  - Summarizes cutover/runtime health into `docs/rule-engine-v2.health.json`.
- `npm run ready:v2`
  - Enforces health gates and fails fast on invalid config.
- `npm run smoke:batch:v2`
  - Runs focused automated smoke cases.
- `npm run smoke:milestone:v2`
  - Runs `ready:v2` + `smoke:batch:v2` and updates trend/history artifacts.

## Smoke Packs
- Quick automated pack (fast confidence):
  1. `npm run ready:v2`
  2. `npm run smoke:batch:v2`
- Milestone pack (before push):
  1. `npm run smoke:milestone:v2`
- Human gameplay pack (manual confidence):
  - [KWS Smoke Checklist](./kws-smoke-checklist.md)
  - [Rule Engine Smoke](./rule-engine-smoke.md)
  - Suggested spell checks: `orbis+domus`, `pyro+rota`, `fridgis+sanctum`

## Before Push Checklist
1. Authoring edits only in SSOT files (`interactions-v2.js`, `spellbook-v2.js`) unless doing intentional plumbing.
2. `npm run ready:v2` passes.
3. `npm run smoke:milestone:v2` passes.
4. If KWS-related changes were made, run [KWS Smoke Checklist](./kws-smoke-checklist.md).
5. Confirm generated artifacts refreshed (`effective-interactions-v2.snapshot.json`, `master-control-v2.*`, milestone outputs).

## Safe Rollback Verification Workflow
1. Create a dedicated fix/test branch from current branch tip.
2. Move that branch to a target commit SHA and push it.
3. Validate online behavior from the fix/test branch deployment.
4. Keep original branch untouched while testing historical SHAs.
5. Promote only known-good commits back into active development.

## Glossary (v2)
- `signal`: normalized trigger identity matched from source events (for example `spell.rota`, `gesture.Y_SPIN`).
- `rule`: condition/action bundle with `on` and `then`.
- `wake_win`: action that opens a wake window and allows listed spell tokens for a TTL.
- `event`: action that dispatches a named runtime effect/action binding.
- `overrides`: per-instance action args that override defaults for that action execution.
- `projection_only`: runtime mode where projected rules from v2 authoring are the active execution source.

## Common Edit Recipes
- Toggle a wake word on/off:
  - edit `src/content/interactions-v2/spellbook-v2.js` -> set `active: true|false`.
- Add a new interaction chain:
  - edit `src/content/interactions-v2/interactions-v2.js` -> add a `rules[]` entry with `on` + `then`.
- Tune one event instance without global changes:
  - in an action, use `overrides` (for example `{ type: "event", id: "grace", overrides: { ms: 900 } }`).
- Validate and smoke:
  - run `npm run ready:v2`
  - run `npm run smoke:milestone:v2`

## FAQ
- Where do I enable/disable a spell?
  - `src/content/interactions-v2/spellbook-v2.js` (`active` flag).
- Where do I change what a spell/gesture chain does?
  - `src/content/interactions-v2/interactions-v2.js` (`rules`).
- Where do I change default behavior for all instances of an event/window?
  - `src/content/spell-rules/rule-engine-master-control.js` (default/override maps).
- Why did my runtime/generated docs change after checks?
  - `ready:v2` and milestone scripts regenerate snapshot/master-control/health artifacts by design.
- What should I avoid editing directly?
  - Generated docs/artifacts under `docs/*v2*.json`, `effective-interactions-v2.snapshot.json`, and milestone outputs.

## Canonical Handle Naming
- Prefer canonical ALLCAPS handles for shared entity IDs where available.
- Source of truth for handle constants:
  - `src/content/interactions-v2/entity-handles-v2.js`
- Typical examples:
  - gestures: `Y_SPIN`, `FSPIN_X`, `FSPIN_Y`, `FSPIN_Z`
  - shakes: `FB_SHAKE`, `LR_SHAKE`, `UD_SHAKE`
  - windows/actions: `WAKE_WIN`
- Keep authoring IDs stable and reuse handles to avoid string drift across rules.

## Start Here
- [Rule Engine Authoring](./rule-engine-authoring.md)
- [Rule Engine Compatibility](./rule-engine-compatibility.md)
- [Rule Engine Smoke](./rule-engine-smoke.md)

## Schema References
- [Interactions Schema](./interactions-schema.md)
- [Master Control Schema](./master-control-schema.md)
- [Generated Master Control (Markdown)](./master-control-v2.md)
- [Generated Master Control (JSON)](./master-control-v2.json)
- [Generated Master Control (Authoring JSON)](./master-control-v2.authoring.json)

## KWS References
- [KWS Smoke Checklist](./kws-smoke-checklist.md)
- [KWS Guardrails](./kws-guardrails.md)

## Architecture Context
- [Architecture Schema (Current Snapshot)](./orbis-arcana-architecture-schema.txt)
- [State Ownership Inventory (Current Snapshot)](./state-ownership-inventory.txt)
- [Receiver Composition](./receiver-composition.txt)

## Snapshot / Health Artifacts
- [Effective Interactions Snapshot](./effective-interactions-v2.snapshot.json)
- [Health Report](./rule-engine-v2.health.json)
- [Status Snapshot](./rule-engine-v2.status.json)
- [Milestone Smoke Report](./rule-engine-v2.milestone-smoke.json)
- [Milestone Trend Summary](./rule-engine-v2.milestone-trend.json)

## Historical Slice Logs
- V2 smoke slices: `docs/rule-engine-v2-slice-*.md`
- V1 smoke slices: `docs/rule-engine-v1-slice-*.md`
