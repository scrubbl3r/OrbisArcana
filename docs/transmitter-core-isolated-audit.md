# Transmitter Core Isolated Audit

Date: 2026-04-07

## Summary

The transmitter has now reached the same kind of milestone the receiver reached
earlier:

- host/page ownership is no longer the main problem
- migration scaffolding is no longer the main problem
- what remains at the root level is now mostly the real motion engine

This is the right point to stop treating the remaining phone monolith as
"unfinished migration residue."

It is now more accurate to treat `mobile-transmitter.js` as the temporary
authoritative transmitter motion core.

## What Now Lives In `src/runtime-shell/transmitter/`

The transmitter domain now owns:

- entry page
- entry bootstrap
- page shell
- lifecycle
- session/bootstrap
- motion input shell
- packet publisher
- audio runtime
- runtime reset
- gesture-lab state
- gesture-lab UI
- gesture template logic
- calibration helper logic

That means transmitter-domain structure is now real and coherent.

## What Still Lives At Root

The root-level `mobile-transmitter.js` is now dominated by:

- orientation handoff
- live motion sample processing
- spin-vector derivation
- groove/lock detection
- smoothness scoring
- dynamics accumulation
- energy earn/decay
- shake meter/hit derivation
- live gesture/calibration orchestration around those samples

In other words:

- not broad app shell
- not bootstrap clutter
- not mostly migration leftovers

It is now mostly the live derivation/runtime core.

## Why This Is A Good Stopping Boundary

The remaining work is no longer in the "safe structural cleanup" category.

Further extraction from `mobile-transmitter.js` would now be a different class
of effort:

- motion-engine refactor
- derivation-family extraction
- runtime architecture redesign

That kind of work can still be worth doing later, but it should be done
deliberately and for a specific reason, not just because a file is still large.

## Recommendation

The current recommendation is:

1. accept `mobile-transmitter.js` as the temporary authoritative motion core
2. stop transmitter migration slicing here
3. only return to this file for:
   - bug fixes
   - cadence tuning
   - deliberate motion-engine refactor work

## Practical Meaning

The cutover picture is now:

- receiver host is cut over to `staging-shell`
- root receiver is archived
- transmitter host/bootstrap structure lives in
  `src/runtime-shell/transmitter/`
- remaining root-level transmitter code is now basically the live motion engine

That is a sane, honest architecture checkpoint.

## Bottom Line

Yes, the core is now isolated.

What remains is no longer something we should keep nibbling at automatically.
It should be treated as the current transmitter motion SSOT until and unless we
choose to do a deeper motion-runtime refactor on purpose.
