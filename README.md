# OrbisArcana
OribisArcanis Game development.

`staging-shell.html` is now the primary game/staging harness.

Primary entry:
- `src/runtime-shell/staging/staging-shell/staging-shell.html`

The shell hosts the active receiver/runtime path, pairing flow, game staging, and
dev staging surface.

The old root receiver is now archived legacy host code.
It is being phased out and should not be used for normal smoke or operator work.

The active phone page is `src/runtime-shell/transmitter/mobile-transmitter.html`, launched by the shell
pairing flow. Receiver retirement is ahead of transmitter retirement in the
current cutover sequence.
