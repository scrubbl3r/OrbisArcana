# Combat Runtime

Combat owns gameplay-impacting effects between entities. Damage, stun, and
motion modifiers live here so spells, enemies, hazards, and the orb share one
vocabulary instead of each creating local one-off effect systems.

- Damage changes HP through `health-pool.js`.
- Stun changes action state through `stun-model.js`.
- Motion modifiers change movement inputs such as lift, drag, or thrust through
  `motion-modifier-model.js`.

Consumers still own their presentation and special behavior. For example, the
orb keeps emitting existing orb lifecycle events for cracks and shatter visuals,
but its HP math is backed by the shared combat health pool.

