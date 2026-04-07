# KWS Smoke Checklist (OpenWakeWord Browser / WASM)

Related index:
- `docs/rule-engine-v2-docs-index.md`

Use this after any KWS/runtime refactor.

Preflight:
- Run `npm run status:v2` before manual KWS checks to confirm current v2 health and contracts are green.

## 1) Boot + Auto Start
- Load `src/runtime-shell/staging/staging-shell/staging-shell.html`.
- Confirm no freeze/hard error on boot.
- Confirm KWS auto-starts without gesture interaction.
- Confirm status line reaches infer-ready path (for example `inf:on/...` after warmup).

## 2) Live Readout Health
- Confirm readout updates continuously (`aud`, `frm`, `q` move).
- Confirm no persistent init stall state.
- Confirm no repeated error spam in the readout.

## 3) Word Detection
- With word window open, trigger each currently active word from `src/content/interactions-v2/wordbook-v2.js` at least once.
- Confirm each word token flashes correctly in the KWS chip row.
- Confirm recognized word tokens log once per valid trigger (no immediate duplicate double-fire).

## 4) Cooldown / Dedupe
- Trigger a word token repeatedly in quick succession.
- Confirm immediate re-triggers are blocked by cooldown.
- Confirm trigger works again after cooldown window.

## 5) Word Window / Token Flow
- Open a spin window and test the currently authored follow-up word set from `interaction-graph-v2.js`.
- Confirm expected token behavior and chip lighting.
- Confirm closing the spin window resets token state.

## 6) Tuning Controls
- Change `Infer TH` and `Infer CD`, then click `Apply`.
- Confirm backend readout reflects new values.
- Confirm detection behavior changes accordingly.

## 7) Recovery Behavior
- Hard refresh and re-run quick boot + one word token test.
- If available, test one reconnect cycle and verify KWS remains functional.

## Pass Criteria
- No freeze.
- Auto-start works.
- Infer reaches ready/active state.
- Canonical word set triggers correctly.
- No duplicate immediate double-fire.
- Tune apply works at runtime.
