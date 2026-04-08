# Runtime Shell CSS Boundaries

Date: 2026-04-08

## Purpose

This note defines where new CSS should live after the shared runtime-shell UI
foundation extraction.

The goal is:

- one shared visual-language SSOT for shell/dev/transmitter UI chrome
- thin local stylesheets for domain structure and component specifics
- world/effect styling kept with the gameplay domain that owns it

## Shared Foundation

Shared runtime-shell UI foundation lives in:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/ui/staging-ui.css`

Put styles here when they represent:

- shared runtime-shell tokens
- shell/dev/transmitter chrome
- shared panel/card treatments
- shared overlay chrome
- shared tool/button chrome
- shared status-widget or popup-header chrome

Do **not** put styles here when they are specific to:

- shell layout
- dev-panel structure
- transmitter phone layout
- orb/world/effect visuals
- future gameplay HUD identity

## Shell CSS

Shell-local CSS lives in:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/staging-shell.css`

This file should own:

- shell page layout
- split-pane geometry
- start-screen geometry
- QR placement
- calibration overlay placement
- boot widget placement/state hooks

This file should consume shared chrome from `staging-ui.css` rather than
redefine the visual language.

## Dev Panel CSS

Dev-panel-local CSS lives in:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/dev-staging/dev-staging.css`

This file should own:

- meter structure
- lamp layout
- log/wordboard internal layout
- dev-panel-specific spacing and composition

It should consume shared tokens and shared chrome from `staging-ui.css`.

## Game Stage CSS

Game-stage CSS lives in:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/game-staging/game-staging.css`

This file currently contains two categories of styling:

1. shell/game-stage UI chrome
2. real world/effect styling

Shared shell/game-stage chrome may consume `staging-ui.css`.

But these should remain local to `game-staging.css`:

- orb visuals
- crack/shatter visuals
- globe/orbit visuals
- shield visuals
- spell/effect rendering surfaces
- world/stage visuals

Those are gameplay/effect-domain styles, not generic shell UI chrome.

## Transmitter CSS

Current transmitter CSS lives in:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/mobile-transmitter.css`

It should use `staging-ui.css` for shared visual language where appropriate,
while keeping:

- phone-specific layout
- round start-button geometry
- LAN connecting overlay geometry

If transmitter later splits into dev/game variants, shared transmitter chrome
can still build on the same runtime-shell UI foundation unless it needs a truly
separate identity.

## Future HUD CSS

Future actual gameplay HUD CSS should be a separate domain.

It is **not** the same as:

- shell UI
- dev panel UI
- transmitter shell UI

HUD styling may reuse low-level tokens deliberately, but it should keep its own
domain boundary and not be collapsed into shell/dev tooling CSS.

## Rule Of Thumb

Ask:

- “Is this styling interface chrome?”
  - shared UI foundation candidate
- “Is this styling local layout or component structure?”
  - keep it in the local domain stylesheet
- “Is this styling an in-world effect/entity/game system?”
  - keep it with the gameplay/effect domain

## Working Rule Going Forward

Prefer this order when adding new styles:

1. shared runtime-shell UI foundation if the rule is genuinely shared
2. local domain stylesheet if the rule is structural or domain-specific
3. gameplay/effect stylesheet if the rule belongs to in-world visuals

Do not create a giant universal stylesheet.

Do not move orb/spell/effect styling into shared shell UI chrome just because it
is visible on the same page.
