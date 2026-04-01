Game-staging is the playable runtime harness used during development.

This area should host:
- the runtime play/test surface
- stage-specific presentation code
- staging-only orchestration around the playable runtime

Reusable gameplay systems and authored content should remain outside staging and
be imported into this harness.

Current extraction boundary from the legacy combined receiver page:
- the right-hand "Game Physics" card
- stage canvases and ground line
- orb/VFX DOM stack
- death overlay
- gravity and fall-drag controls

Still intentionally left behind in the legacy combined page for later slices:
- meters and status readouts
- logs and word flashboard
- pairing/session modals
- calibration overlay orchestration
- receiver/transmitter runtime guts
