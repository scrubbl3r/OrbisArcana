Orb-stage is the playable runtime harness used during development.

This area should host:
- the runtime play/test surface
- stage-specific presentation code
- staging-only orchestration around the playable runtime

Reusable gameplay systems and authored content should remain outside staging and
be imported into this harness.

Current extraction boundary inside the staging shell:
- the right-hand orb-stage card
- stage canvases and ground line
- orb/VFX DOM stack
- death overlay

Intentionally kept outside orb-stage:
- dev-stage panels such as dynamics, log, and tuning surfaces
- shell-owned pairing/session overlays
- shell-owned calibration and onboarding flow
- shared runtime systems and receiver/transmitter orchestration
