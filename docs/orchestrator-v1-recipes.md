# Orchestrator v1 DSL v0 Recipes

Companion examples for [Orchestrator v1 DSL schema](./orchestrator-v1-schema.md).

Conventions:
- Keywords are uppercase.
- IDs are canonical lowercase.
- Recipes are intentionally compact and human-readable.

## 1) Starter Wake Palette

```txt
ON orbis OPEN(2000ms) { domus, electrum, pyro, fridgis }
```

## 2) Axis Branching with Window

```txt
ON electrum OPEN(1800ms) {
  ON sanctum TRIGGER { shield_freeze }
  ON rota TRIGGER { aoe_frost }
  ON vectus TRIGGER { ranged_frost }
}
```

## 3) Simple Teleport Spell

```txt
ON domus TRIGGER { orb_flash_2, teleport_home }
COOLDOWN(1200ms)
```

## 4) Basic Universal Shockwave

```txt
ON shake_ud, shake_lr, shake_fb
TRIGGER { shockwave_basic }
COOLDOWN(800ms)
```

## 5) Special Shake Override with Fallback

```txt
ON shake_ud
WHEN unlocked.shake_ud_special AND primed.domus
PRIORITY(100)
TRIGGER { shockwave_ud_special }
FALLBACK { shockwave_basic }
COOLDOWN(800ms)
UNTIL buffs.ud_special_expires_at
```

## 6) Orb-Only Defensive Reaction

```txt
ON spin_y
WHEN orb_state.charged
TRIGGER { immune_freeze }
COOLDOWN(3000ms)
```

## 7) Environmental Trap: Poison Cloud DOT

```txt
ON world.poison_cloud_enter
WHEN target.orb
TRIGGER { dot_poison_apply }

ON world.poison_cloud_tick
WHILE state.dot_poison_active
TRIGGER { orb_health_drain_small, orb_lift_drain_small }

ON world.poison_cloud_exit
TRIGGER { dot_poison_clear }
```

## 8) Environmental Trap: Gravity Well

```txt
ON world.gravity_well_enter
WHEN target.orb
TRIGGER { gravity_mul_up, movement_drag_up }
UNTIL world.gravity_well_exit

ON world.gravity_well_exit
TRIGGER { gravity_mul_reset, movement_drag_reset }
```

## 9) Enemy Behavior: Gnat Swarm (Simple)

```txt
ON enemy.gnat_swarm_spawn
TRIGGER { gnat_swarm_seek_orb }

ON enemy.gnat_swarm_contact
WHILE enemy.gnat_swarm_alive
TRIGGER { orb_lift_drain_tick, orb_health_drain_tick, sfx_gnat_buzz_hit }
COOLDOWN(250ms)

ON enemy.gnat_swarm_repulsed
TRIGGER { gnat_swarm_stagger, sfx_gnat_scatter }
```

## 10) Counterplay Loop: Shockwave vs Gnats

```txt
ON shake_ud, shake_lr, shake_fb
WHEN enemy.gnat_swarm_nearby
PRIORITY(90)
TRIGGER { shockwave_basic, gnat_swarm_knockback, gnat_swarm_contact_clear }
FALLBACK { shockwave_basic }

ON enemy.gnat_swarm_contact
WHEN orb_state.superheated
TRIGGER { gnat_swarm_burn_tick }
```

## Notes for Build-Out

- These examples assume compendium IDs exist for world/enemy events and orb effects.
- Keep world/enemy nouns in namespaces:
  - `world.*`
  - `enemy.*`
  - `orb_*` action/event IDs
- Keep cast/VFX/SFX as separate triggerable IDs so orchestration can recombine them freely.

## Authoring Shorthand Examples

```txt
# Comma ON shorthand
ON "rota, spin_y, charged" TRIGGER "grace, aoe_electric"

# Object ON aliases + OPEN/TTL alias + TRIGGERS alias
ON { spells: "rota, sanctum", gestures: "spin_y", orbStates: "charged" }
OPEN { words: "vectus, sanctum", ttl: 1800 } # compatibility alias: spells
TRIGGERS "grace, aoe_electric"

# Type alias forms
ON orbstate:charged TRIGGER grace
ON orb-state:charged TRIGGER grace
```
