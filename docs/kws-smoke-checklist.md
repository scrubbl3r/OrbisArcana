# KWS Smoke Checklist (openWakeWord Browser / WASM)

Related index:
- `docs/rule-engine-v2-docs-index.md`

Use this after any KWS/runtime refactor.

## 1) Boot + Auto Start
- Load `game-receiver.html`.
- Confirm no freeze/hard error on boot.
- Confirm KWS auto-starts without gesture interaction.
- Confirm status line reaches infer-ready path (for example `inf:on/...` after warmup).

## 2) Live Readout Health
- Confirm readout updates continuously (`aud`, `frm`, `q` move).
- Confirm no persistent init stall state.
- Confirm no repeated error spam in the readout.

## 3) Wake Word Detection
- With cast window open, trigger each canonical token at least once:
  - `orbis`
  - `domus`
  - `tempus`
  - `fridgis`
  - `electrum`
  - `rota`
  - `sanctum`
  - `vectus`
- Confirm each token flashes correctly in the KWS chip row.
- Confirm recognized tokens log once per valid trigger (no immediate duplicate double-fire).

## 4) Cooldown / Dedupe
- Trigger a token repeatedly in quick succession.
- Confirm immediate re-triggers are blocked by cooldown.
- Confirm trigger works again after cooldown window.

## 5) Spell Window / Token Flow
- Open flat-spin token window and test token set (`rota`, `sanctum`, `vectus`).
- Confirm expected token behavior and chip lighting.
- Confirm closing token window resets token-heard state.

## 6) Tuning Controls
- Change `Infer TH` and `Infer CD`, then click `Apply`.
- Confirm backend readout reflects new values.
- Confirm detection behavior changes accordingly.

## 7) Recovery Behavior
- Hard refresh and re-run quick boot + one-token test.
- If available, test one reconnect cycle and verify KWS remains functional.

## Pass Criteria
- No freeze.
- Auto-start works.
- Infer reaches ready/active state.
- Canonical token set triggers correctly.
- No duplicate immediate double-fire.
- Tune apply works at runtime.
