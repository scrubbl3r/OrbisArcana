Receiver shell code lives here.

Use this for receiver-edge ingestion/runtime concerns such as:
- mobile impulse ingestion
- receiver-side input/transport adaptation
- receiver-role shell/runtime logic

Do not use this directory for the large debug/staging host surface that the
prototype currently exposes. That composite experience belongs under
`src/runtime-shell/staging/`.
