## Spin SSOT Note

Spin is a small exception to the usual receiver-side signal pattern.

Most canonical motion values in this codebase are derived on the receiver from raw or lightly processed mobile payloads. Spin is different because reliable `x / y / z` parity depends on the phone's calibrated, orientation-aware frame. Reconstructing spin purely from receiver-side `rotationRate` weakened `z` parity versus the legacy behavior.

The canonical split is now:

- phone derives:
  - `spinVector`
  - `spinDirection`
- receiver derives:
  - `spin.label`
  - `spin.dominance`
  - `spin.gap`
  - and publishes the full spin package through `MotionStore`

So the phone remains the derivation origin for calibrated spin truth, while the receiver remains the SSOT publisher and interpreter for runtime consumers.

Important consequences:

- `shieldAxis` and `shieldRGB` are sunset
- live spin/color behavior runs from canonical `spinVector` / `spinDirection`
- `MotionStore.spin.vector` is the canonical vector field; there is no duplicate `spin.axis`
