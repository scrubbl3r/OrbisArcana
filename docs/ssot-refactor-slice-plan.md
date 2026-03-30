# SSOT Refactor Slice Plan

## Purpose

This document captures the refactor plan for removing legacy behavior taxonomy and making authored config the actual SSOT.

It is intended as a handoff document for new threads after crashes/interruption.

## Current Diagnosis

The codebase is in a mixed state:

- `interaction-graph-v2` is the intended behavior authoring source.
- Runtime still contains legacy inferred behavior concepts.
- Those legacy concepts are reintroducing hidden semantics outside authored config.

The main legacy junk identified so far:

- axis words
- wake window words
- flat spin
- axis-selected runtime state
- axis-partitioned slot state
- spell-family meaning inferred from specific token classes

These concepts are not part of the target model and should be removed rather than renamed.

## Target Model

### Inputs

There are only three gameplay input families:

- `word`
- `spin`
- `shake`

Meaning:

- `word` carries a word id like `pyro`, `domus`, `rota`
- `spin` carries a value like `x`, `y`, `z`
- `shake` carries a value like `UD`, `LR`, `FB`

### Composition Primitives

Behavior sequencing is authored only through:

- `open`
- `requires`
- `consume`

### Outcome Primitives

Behavior outcomes are authored only through:

- `bind`
- `trigger`

### Slots

Slots are global and fungible:

- `UD`
- `LR`
- `FB`

Slots are not partitioned by axis and have nothing to do with axis semantics.

## Architectural Rule

Runtime must not invent gameplay meaning outside authored config.

That means:

- no classifying words into gameplay roles like axis words
- no classifying follow-up words into wake-window-word categories
- no deriving behavior from naming conventions like `school.*`
- no hidden axis provenance injection
- no runtime chain reconstruction from token taxonomy

The correct runtime behavior is:

1. Receive input signal (`word`, `spin`, `shake`)
2. Evaluate authored rules
3. Respect authored windows and `requires`
4. Execute authored `bind` or `trigger`

## Vocabulary Rules

### Canonical Terms

Use these terms:

- `word`
- `spin`
- `shake`
- `slot`
- `window`
- `bind`
- `trigger`

### Deprecated Terms

These should be treated as legacy and removed:

- `axis`
- `axis word`
- `wake window word`
- `flat spin`
- `axis-selected`

### Schema Direction

Preferred selector language:

- `on: { word: "pyro" }`
- `on: { spin: "y" }`
- `on: { shake: "FB" }`

Temporary compatibility aliases may exist during migration, but target naming should match the model above.

## Core Refactor Objectives

1. Make slots global.
2. Remove axis-word plumbing.
3. Remove wake-window-word plumbing.
4. Remove flat-spin terminology and semantics.
5. Make `bind` a first-class direct action.
6. Make runtime consume authored semantics directly.
7. Rewrite checks around exemplar behaviors instead of legacy categories.
8. Clean KWS/UI of legacy axis and wake-window state.

## Surgical Backlog

### A. Freeze The Architecture

#### A1. Write the architecture rule

Goal:

- document the canonical input/composition/outcome model

Files:

- `docs/`

Done when:

- the target model is written down and stable

#### A2. Publish vocabulary table

Goal:

- define canonical vs deprecated terms

Files:

- `docs/`

Done when:

- new threads can use one language set consistently

### B. Make Slots Global

#### B1. Replace axis-partitioned slot state

Files:

- `src/systems/spell-dispatch-system.js`

Remove or rewrite:

- `loadedByAxis`
- `nextSlotIndexByAxis`
- axis-based slot lookup paths

Replace with:

- `loadedBySlot = { UD: null, LR: null, FB: null }`

#### B2. Normalize slot load/cast helpers

Files:

- `src/systems/spell-dispatch-system.js`

Rewrite:

- `loadSlot`
- `castSlot`
- any helper expecting axis context

Done when:

- slot behavior is purely `UD/LR/FB`

### C. Remove Axis-Word Plumbing

#### C1. Delete axis role inference from routing

Files:

- `src/content/spells/spell-runtime-routing.js`

Remove:

- `axisWordIds`
- `AXIS_BY_WORD_ID`
- `intent: "spell.axis_select"`
- `axisWord`
- `axisSpell`
- `allowedAxes`

#### C2. Delete axis-selected state from dispatch

Files:

- `src/systems/spell-dispatch-system.js`

Remove:

- `selectedAxisWordByAxis`
- `isAxisSelectIntent`
- `axisAllowedForSpell`
- `resolveAxisForSlotPayload`
- axis-based fallback logic

#### C3. Remove axis-selected events

Files:

- `src/systems/spell-dispatch-system.js`
- `src/contracts/events.js`
- event consumers

Remove:

- `EVT_VOICE_AXIS_SELECTED` behavior flow if no longer needed

### D. Remove Wake-Window-Word Plumbing

#### D1. Delete wake-window role inference from routing

Files:

- `src/content/spells/spell-runtime-routing.js`

Remove:

- `wakeWindowWordIds`
- `WAKE_WINDOW_SLOT_BY_WORD_ID`
- `intent: "spell.wake_window_select"`
- `wakeWindowWord`
- `wakeWindowSpell`

#### D2. Delete wake-token resolution from dispatch

Files:

- `src/systems/spell-dispatch-system.js`

Remove:

- `normalizeWakeWindowTokenForRuntime`
- `resolveConcreteSpellForAxis`
- `isWakeWindowSelectIntent`

#### D3. Replace role-based gating with authored gating

Files:

- rule/orchestrator execution path
- `src/systems/spell-dispatch-system.js`

Replace:

- token category gating

With:

- active authored windows plus `requires`

### E. Remove Flat-Spin Terminology And Semantics

#### E1. Remove flat-spin as a concept

Files:

- runtime logic
- checks
- docs

Remove:

- naming and logic that treat flat spin as a primitive

Replace with:

- concrete `spin` signals only

#### E2. Keep spin-gated behavior only if authored

Files:

- authored config
- rule evaluation

Rule:

- if a spin opens behavior, it must be because authored rules say so

### F. Make `bind` A Direct Runtime Action

#### F1. Stop injecting hidden axis metadata into bind

Files:

- `src/content/interactions-v2/compile-interaction-graph-v2.js`

Remove:

- `AXIS_WORD_BY_BOUND_SPELL_ID`
- injected `axisWord` metadata

#### F2. Introduce direct compiled bind action

Files:

- compiler
- execution path

Replace:

- lowering `bind` into legacy `spell_load_*` actions

With:

- direct bind action semantics

Conceptual target:

- `{ type: "bind", spell: "aoe_flame", slot: "FB" }`

#### F3. Add runtime executor for direct bind

Files:

- rule execution path
- dispatch adapter layer

Goal:

- execute slot load directly from `bind`

### G. Simplify Runtime Action Handlers

#### G1. Remove family inference handlers

Files:

- `src/systems/spell-action-handlers.js`

Remove:

- `play_axis_aoe`

Keep:

- explicit per-spell handlers only

#### G2. Keep slot actions as plain execution primitives

Files:

- `src/systems/spell-action-handlers.js`

Keep for transition:

- `load_spell_ud`
- `load_spell_lr`
- `load_spell_fb`
- `cast_loaded_ud`
- `cast_loaded_lr`
- `cast_loaded_fb`

### H. Rename Schema Toward `word` / `spin` / `shake`

#### H1. Rename selector vocabulary internally

Files:

- `src/content/interactions-v2/validate-interaction-graph-v2.js`
- `src/content/interactions-v2/compile-interaction-graph-v2.js`
- `src/content/interactions-v2/validate-compiled-interaction-graph-v2.js`

Goal:

- move toward `spin` and `shake`

#### H2. Decide compatibility window

Options:

- temporary alias support
- full cutover

Need:

- explicit migration policy

### I. Rewrite Tests Around Exemplars

#### I1. Replace axis/wake taxonomy checks

Files:

- `tools/rule-engine-v2/check-wake-window-load-regression-v2.mjs`
- `tools/rule-engine-v2/check-wake-window-axis-prereq-regression-v2.mjs`
- `tools/rule-engine-v2/check-flat-spin-gating-regression-v2.mjs`

Remove:

- tests whose premise is axis selection or wake-window token taxonomy

#### I2. Add exemplar behavior tests

Exemplars:

- teleport exemplar
- electric exemplar
- pyro bind exemplar
- shockwave cast exemplar

#### I3. Add window gating tests

Need direct coverage for:

- `open`
- `requires`
- `consume`

### J. Clean KWS/UI Legacy State

#### J1. Remove axis UI state

Files:

- `src/ui/kws-panel-controller.js`
- `src/voice/kws/kws-event-bindings.js`
- `src/voice/kws/kws-config.js`

Remove:

- selected axis display
- axis token flashing
- axis lookup tables

#### J2. Replace with neutral runtime state if needed

Possible UI concepts:

- active windows
- loaded slots
- recent input signals

### K. Final Cleanup

#### K1. Remove dead exports/constants

Search/remove:

- `axisWord`
- `axisSpell`
- `wakeWindowWord`
- `wakeWindowSpell`
- `spell.axis_select`
- `spell.wake_window_select`
- `flat_spin`

#### K2. Regenerate docs last

Files:

- `docs/master-control-v2.md`
- `docs/master-control-v2.json`
- `docs/master-control-v2.authoring.json`
- `docs/effective-interactions-v2.snapshot.json`

Rule:

- only regenerate once logic is stable

## Slice Plan

### Slice 0: Planning And Vocabulary Freeze

Goal:

- lock architecture and naming before code changes

Tasks:

- A1
- A2

Output:

- written architecture rule
- written vocabulary table

Risk:

- low

### Slice 1: Global Slots + Axis Removal

Goal:

- remove the most structurally toxic runtime assumptions first

Tasks:

- B1
- B2
- C1
- C2
- C3

Files likely touched:

- `src/systems/spell-dispatch-system.js`
- `src/content/spells/spell-runtime-routing.js`
- `src/contracts/events.js`
- axis event consumers

Expected result:

- slots are global
- no selected-axis runtime state
- no axis-word gameplay role

Risk:

- high

Validation:

- slot load/cast paths still function
- working exemplars not blocked by removed axis logic

### Slice 2: Wake-Window-Word Removal

Goal:

- remove global follow-up word taxonomy and replace it with authored gating

Tasks:

- D1
- D2
- D3

Files likely touched:

- `src/content/spells/spell-runtime-routing.js`
- `src/systems/spell-dispatch-system.js`
- rule/orchestrator execution path

Expected result:

- no runtime category called wake-window words
- follow-up validity comes from windows and `requires`

Risk:

- high

Validation:

- exemplar chains still gate correctly through `open` and `requires`

### Slice 3: Remove Flat-Spin + Normalize Spins

Goal:

- eliminate flat-spin concept and keep only concrete spins

Tasks:

- E1
- E2
- begin H1

Files likely touched:

- runtime logic
- schema validators
- checks/docs

Expected result:

- no flat-spin primitive
- spin behavior exists only if authored

Risk:

- medium

### Slice 4: Direct `bind`

Goal:

- make `bind` a real first-class authored action end-to-end

Tasks:

- F1
- F2
- F3
- G2 review

Files likely touched:

- `src/content/interactions-v2/compile-interaction-graph-v2.js`
- rule execution path
- dispatch/load adapter path

Expected result:

- `bind` no longer compiles into hidden legacy role/event semantics
- runtime directly loads spells into slots from authored bind actions

Risk:

- very high

Validation:

- pyro exemplar binds directly into slot
- no hidden axis metadata survives

### Slice 5: Schema Naming Cutover

Goal:

- align authored vocabulary to the actual model

Tasks:

- H1
- H2

Files likely touched:

- orchestrator validators/compiler
- authored config consumers

Expected result:

- selectors move toward `word` / `spin` / `shake`

Risk:

- medium

### Slice 6: Test Suite Rebase On Exemplars

Goal:

- replace legacy-taxonomy tests with exemplar-behavior tests

Tasks:

- I1
- I2
- I3

Files likely touched:

- `tools/rule-engine-v2/` regression checks

Expected result:

- tests mirror authored behaviors, not historical plumbing

Risk:

- medium

### Slice 7: KWS/UI Cleanup

Goal:

- remove axis/wake-window legacy state from UI and KWS surfaces

Tasks:

- J1
- J2

Files likely touched:

- `src/ui/kws-panel-controller.js`
- `src/voice/kws/kws-config.js`
- `src/voice/kws/kws-event-bindings.js`

Expected result:

- no UI/KWS state for removed concepts

Risk:

- medium

### Slice 8: Dead Code Purge + Docs Refresh

Goal:

- finish cleanup after behavior is stable

Tasks:

- K1
- K2

Expected result:

- no legacy vocabulary remains in active behavior code
- generated docs reflect new model only

Risk:

- low

## Recommended Execution Order

1. Slice 0
2. Slice 1
3. Slice 2
4. Slice 3
5. Slice 4
6. Slice 5
7. Slice 6
8. Slice 7
9. Slice 8

## Highest-Risk Areas

These need extra care during implementation:

- global slot conversion
- deleting axis-selected state
- deleting wake-window-word resolution
- making `bind` direct

## Success Criteria

The refactor is successful when all of the following are true:

- no runtime file infers gameplay roles from specific words
- slot state is global, not axis-partitioned
- no code depends on axis words
- no code depends on wake-window words
- no code depends on flat-spin as a primitive
- `bind` is direct and explicit
- exemplar behaviors are fully authored in `interaction-graph-v2`
- tests describe authored behavior, not historical plumbing

## Fresh Thread Context Paste

Use this summary in a fresh thread if needed:

We are refactoring Orbis Arcana toward a true authored SSOT. The target model is: inputs are only `word`, `spin`, and `shake`; behavior sequencing is only `open`, `requires`, `consume`; outcomes are only `bind` and `trigger`; slots are global `UD/LR/FB`. Legacy concepts like axis words, wake window words, flat spin, axis-selected state, and axis-partitioned slots are considered toxic legacy plumbing and should be removed, not preserved. The active refactor document is `docs/ssot-refactor-slice-plan.md`. Follow the slice plan in order, starting with global slots + axis removal, then wake-window-word removal, then direct bind, then tests/UI/docs cleanup.
