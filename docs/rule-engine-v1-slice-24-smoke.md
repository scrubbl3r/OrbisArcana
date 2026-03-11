# Rule Engine V1 Slice 24 Smoke Checklist

## Purpose
- Remove deprecated KWS config aliases (`schoolTokens`, `classTokens`) and consume neutral keys only (`axisTokens`, `wakeWindowTokens`).

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) KWS UI token sanity
- Confirm token rows render normally.
- Confirm wake token opens gate and wake-window spell tokens light/hear as expected.

3) Config key sanity
- Inspect KWS runtime config object.
- Confirm `axisTokens` and `wakeWindowTokens` are present.
- Confirm `schoolTokens` and `classTokens` are absent.
