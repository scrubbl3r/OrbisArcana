# OrbisArcana
OribisArcanis Game development.

`staging-shell.html` is now the primary game/staging harness.

Primary entry:
- `src/runtime-shell/staging/staging-shell/staging-shell.html`

Legacy fallback comparator:
- `game-receiver.html`

The shell hosts the active receiver/runtime path, pairing flow, game staging, and
dev staging surface. The old root receiver remains temporarily available during
retirement work, but it should no longer be treated as the default smoke page.

The active phone page is still `mobile-transmitter.html`, launched by the shell
pairing flow. Receiver retirement is ahead of transmitter retirement in the
current cutover sequence.
