# Rule Engine V1 Slice 16 Smoke Checklist

## Purpose
- Remove hardcoded OpenWakeWord simulation/default infer tokens.
- Source them from active spellbook + routing constants.

## Quick Smoke (Manual)
1) Sim token source
- Enable OpenWakeWord simulate mode.
- Confirm emitted simulation tokens come from configured active spell IDs (`KWS_SIM_SPELL_IDS`), not a hardcoded backend list.

2) Default infer token source
- Check OpenWakeWord default config.
- Confirm `inferToken` resolves from `KWS_INFER_DEFAULT_SPELL_ID` + active spell phrase.

3) Active toggle check
- Temporarily set one simulated spell inactive in spellbook.
- Restart and confirm simulation token set updates accordingly.
