# Rule Engine V2 Slice 13 Smoke

## Goal
fail fast when active spellbook entries are not backed by KWS manifest model files.

## What is now enforced

1. Every active spellbook `onnx` id must have a matching manifest model `<onnx>.onnx`.
2. Every manifest model file must exist on disk.
3. Every manifest model must have a `.onnx.data` pair file.

## Quick negative smoke

1. Temporarily set an active spell `onnx` to a non-existent model id (for example `missing_model`).
2. Run `npm run ready:v2`.
3. Expected: fail with `kws manifest does not cover active spellbook`.

## Restore

Revert edit and rerun `npm run ready:v2`; expected pass.
