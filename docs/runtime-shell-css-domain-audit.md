# Runtime Shell CSS Domain Audit

Date: 2026-04-08

## Goal

Establish a clean style-domain boundary for:

- shared dev/staging shell chrome
- shell-local layout
- dev-panel-specific UI
- game-stage/world styling
- transmitter UI
- future game HUD styling

The important architectural distinction is:

- UI chrome styles should be shared where appropriate
- world/effect styles should stay with the gameplay/effect domain that owns them

## Current CSS Inventory

Current runtime-facing CSS files:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/staging-shell.css`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/dev-staging/dev-staging.css`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/game-staging/game-staging.css`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/mobile-transmitter.css`

This is a good starting point: the number of files is still small enough to reorganize cleanly.

## What Each File Currently Owns

### `staging-shell.css`

Owns:

- root shell tokens:
  - `--bg`
  - `--surface`
  - `--surface-raised`
  - `--text`
  - `--text-strong`
  - `--text-muted`
  - `--frame`
- boot status widget
- start screen / QR launch screen
- calibration overlay
- shell page layout and mount geometry

Assessment:

- shell layout belongs here
- boot widget placement belongs here
- root visual tokens should not remain unique to this file long-term
- start/calibration overlay chrome overlaps strongly with general shell/dev UI chrome

### `dev-staging.css`

Owns:

- duplicate/shared visual tokens:
  - `--surface`
  - `--surface-raised`
  - `--text`
  - `--text-strong`
  - `--text-muted`
  - `--frame-rgb`
  - `--frame`
  - `--frame-strong`
- dev panel card chrome
- header/status/button styles
- meter styles
- lamp styles
- fatal/readout/note styles
- popup/log/wordboard panel chrome

Assessment:

- this file contains the clearest candidate set for shared dev/staging UI chrome
- many of these patterns are not unique to the dev panel
- the actual meter/lamp/log popup selectors should likely stay here, but they should consume shared tokens and shared chrome primitives

### `game-staging.css`

Owns two different domains today:

1. shell/game-stage UI chrome

- duplicate/shared visual tokens:
  - `--bg`
  - `--surface`
  - `--surface-raised`
  - `--text`
  - `--text-strong`
  - `--frame-rgb`
  - `--frame`
  - `--emphasis`
- game-stage card chrome
- header
- stage frame
- death panel / death card / stage button
- slider/control styling

2. real world/effect styling

- orb base visuals
- orb cracks/shatter
- globe visuals
- shield visuals
- shock/flame/electric effect layers

Assessment:

- the shell/game-stage card, header, controls, and death-panel chrome overlap with shared shell/dev UI
- the orb/globe/shield/spell/effect styles should **not** be pulled into shared shell UI CSS
- this file needs clearer internal separation, even if it remains one file for now

### `mobile-transmitter.css`

Owns:

- duplicate/shared tokens in a transmitter-specific form
- transmitter body/background
- start button
- LAN connecting overlay + spinner

Assessment:

- transmitter UI is visually in the same family as shell/dev surfaces, but simplified
- it is a good consumer for shared runtime-shell UI tokens/chrome
- it should not necessarily inherit every shell/dev component selector, only the shared visual language

## Shared UI Chrome That Is Clearly Duplicated

These are the most obvious shared styling concerns across current files:

- dark background and surface token family
- frame/border token family
- strong/muted text token family
- raised surface backgrounds
- panel/card chrome:
  - dark surface
  - 1px frame stroke
  - rounded corners
  - soft shadow
- overlay/backdrop chrome
- primary shell/dev buttons
- small status/readout widget chrome

These are the best first extraction candidates.

## Styling That Should Stay Local

These should remain in the domain that owns them:

### Shell-local

- split layout
- start screen geometry
- QR placement
- calibration overlay placement
- boot widget placement

### Dev-panel-local

- meter structure
- lamp layout
- popup layout
- word/log board internal layout

### Game-stage/world-local

- orb visuals
- crack/shatter visuals
- globe visuals
- shield visuals
- electric/flame/shock rendering surfaces
- stage/world geometry

### Transmitter-local

- round start-button geometry
- phone viewport/app shell layout
- LAN connecting overlay geometry

### Future HUD-local

- future actual gameplay HUD chrome
- should be a separate style domain from shell/dev tooling

## Recommended Target CSS Architecture

### 1. Shared runtime-shell UI foundation

Recommended new home:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/ui/staging-ui.css`

This file should own:

- shared design tokens for dev/staging/transmitter tooling
- shared panel chrome primitives
- shared overlay chrome
- shared button chrome
- shared status widget/readout chrome

It should **not** own:

- orb/effect/world visuals
- shell layout
- dev-panel structure
- transmitter-specific geometry
- future game HUD identity

### 2. `staging-shell.css`

Should become:

- shell layout only
- shell-specific placements
- boot widget placement/state hooks
- start/calibration flow geometry

It should consume shared tokens/primitives from `staging-ui.css`.

### 3. `dev-staging.css`

Should become:

- dev-panel component structure
- meter/lamp/log/wordboard selectors
- local composition/layout for those components

It should consume shared tokens/chrome from `staging-ui.css`.

### 4. `game-staging.css`

Should remain game-stage-local, but conceptually split into:

- shell chrome/controls section
- world/effect styling section

Near-term it can stay one file, but the shared shell chrome should be reduced by using `staging-ui.css`.

The orb/spell/effect styling should stay here.

### 5. `mobile-transmitter.css`

Should become a consumer of `staging-ui.css` tokens/chrome where appropriate.

It should keep:

- phone-specific layout
- round start-button geometry
- LAN overlay geometry

## Recommended Slice Order

### Slice 1. Add shared CSS foundation

Create:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/ui/staging-ui.css`

Move only:

- shared tokens
- shared frame/text/surface vars
- a small set of shared chrome primitives

Do **not** move large selector blocks yet.

### Slice 2. Make current consumers import the foundation

Update:

- `staging-shell.html`
- `src/runtime-shell/transmitter/mobile-transmitter.html`

and any relevant staging pages so the shared foundation loads before local CSS.

### Slice 3. Dry out obvious shared chrome

Move into the shared foundation:

- common panel/card chrome
- common overlay card chrome
- common button chrome
- common status-widget chrome

Keep local geometry/selectors in place.

### Slice 4. Thin local stylesheets

After shared extraction:

- reduce duplicated token declarations
- keep shell-only layout in `staging-shell.css`
- keep dev-panel specifics in `dev-staging.css`
- keep transmitter-local geometry in `mobile-transmitter.css`

### Slice 5. Document CSS boundaries

Add a short architecture note describing:

- what goes in shared shell UI CSS
- what stays local
- what stays in world/effect CSS
- how future HUD CSS should remain separate

## Recommendation

Proceed with the shared foundation extraction.

The current CSS situation is still clean enough to improve without pain, and there is clear duplicated shell/dev/transmitter chrome worth consolidating.

But do **not** try to create one mega universal stylesheet.

The professional target here is:

- one shared runtime-shell UI foundation
- thin colocated domain CSS files
- world/effect styles left with their owning game/effect domain
