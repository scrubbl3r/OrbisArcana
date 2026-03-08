# Rule Engine V1 Slice 198 Smoke

Goal
- Fail fast on missing/duplicate ids in `windows` and `events` definitions.

Checks
- Add a temporary window without id in `windows`:
  - `{ enabled: true, defaultArgs: {} }`
- Run config validation/startup path.
- Confirm validation includes:
  - `window has missing id`

- Add a duplicate event id in `events`:
  - two entries with `id: "grace"`
- Confirm validation includes:
  - `duplicate event id: grace`

Cleanup
- Restore unique/non-empty ids and confirm normal startup/validation is clean again.
