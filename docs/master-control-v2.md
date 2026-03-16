# OrbisArcana Master Control V2

Generated: 2026-03-16T18:07:45.448Z

This document is generated from SSOT:
- spellbook: `src/content/interactions-v2/spellbook-v2.js`
- interactions: `src/content/interactions-v2/interactions-v2.js`

## Runtime Flags

- interactionsEnabled: true

## Spellbook (SSOT)

```json
{
  "version": "2",
  "spells": [
    {
      "id": "orbis",
      "phrase": "orbis",
      "active": true,
      "onnx": "orbis",
      "confidence": 0.6,
      "cooldownMs": 0
    },
    {
      "id": "arcana",
      "phrase": "arcana",
      "active": true,
      "onnx": "arcana",
      "confidence": 0.6,
      "cooldownMs": 0
    },
    {
      "id": "are_kay_nah",
      "phrase": "are kay nah",
      "active": true,
      "onnx": "are_kay_nah",
      "confidence": 0.6,
      "cooldownMs": 0
    },
    {
      "id": "domus",
      "phrase": "domus",
      "active": true,
      "onnx": "domus",
      "confidence": 0.6,
      "cooldownMs": 0
    },
    {
      "id": "pyro",
      "phrase": "pyro",
      "active": true,
      "onnx": "pyro",
      "confidence": 0.6,
      "cooldownMs": 0
    },
    {
      "id": "fridgis",
      "phrase": "fridgis",
      "active": true,
      "onnx": "fridgis",
      "confidence": 0.6,
      "cooldownMs": 0
    },
    {
      "id": "electrum",
      "phrase": "electrum",
      "active": true,
      "onnx": "electrum",
      "confidence": 0.6,
      "cooldownMs": 0
    },
    {
      "id": "sanctum",
      "phrase": "sanctum",
      "active": true,
      "onnx": "sanctum",
      "confidence": 0.6,
      "cooldownMs": 0
    },
    {
      "id": "vectus",
      "phrase": "vectus",
      "active": true,
      "onnx": "vectus",
      "confidence": 0.4,
      "cooldownMs": 0
    },
    {
      "id": "rota",
      "phrase": "rota",
      "active": true,
      "onnx": "rota",
      "confidence": 0.6,
      "cooldownMs": 0
    }
  ]
}
```

## Interaction Defaults (SSOT)

```json
{
  "wakeWin": {
    "ttlMs": 2000
  },
  "event": {
    "grace": {
      "ms": 500
    }
  }
}
```

## Interaction Rules (SSOT)

```json
[
  {
    "id": "r_fridgis_immediate",
    "on": {
      "all": [
        {
          "type": "spell",
          "id": "spell.fridgis"
        }
      ]
    },
    "then": [
      {
        "type": "event",
        "id": "aoe_frost"
      }
    ]
  },
  {
    "id": "r_electrum_immediate",
    "on": {
      "all": [
        {
          "type": "spell",
          "id": "spell.electrum"
        }
      ]
    },
    "then": [
      {
        "type": "event",
        "id": "aoe_electric"
      }
    ]
  },
  {
    "id": "r_pyro_immediate",
    "on": {
      "all": [
        {
          "type": "spell",
          "id": "spell.pyro"
        }
      ]
    },
    "then": [
      {
        "type": "event",
        "id": "aoe_flame"
      }
    ]
  },
  {
    "id": "r_domus_immediate",
    "on": {
      "all": [
        {
          "type": "spell",
          "id": "spell.domus"
        }
      ]
    },
    "then": [
      {
        "type": "event",
        "id": "teleport_home"
      }
    ]
  },
  {
    "id": "r_rota_yspin_charged",
    "on": {
      "all": [
        {
          "type": "spell",
          "id": "spell.rota"
        },
        {
          "type": "gesture",
          "id": "gesture.y_spin"
        },
        {
          "type": "orb_state",
          "id": "orb_state.charged"
        }
      ]
    },
    "then": [
      {
        "type": "wake_win",
        "spells": [
          "spell.rota",
          "spell.sanctum",
          "spell.vectus"
        ]
      },
      {
        "type": "event",
        "id": "aoe_electric",
        "range": 14
      },
      {
        "type": "event",
        "id": "grace"
      },
      {
        "type": "event",
        "id": "orb_state",
        "overrides": {
          "state": "superheated"
        }
      }
    ]
  }
]
```

## Canonical Handles (Nuggets)

### Signals

```json
{
  "ORBIS": "spell.orbis",
  "ARCANA": "spell.arcana",
  "ARE_KAY_NAH": "spell.are_kay_nah",
  "DOMUS": "spell.domus",
  "PYRO": "spell.pyro",
  "FRIDGIS": "spell.fridgis",
  "ELECTRUM": "spell.electrum",
  "SANCTUM": "spell.sanctum",
  "VECTUS": "spell.vectus",
  "ROTA": "spell.rota",
  "SPIN_X": "gesture.x_spin",
  "SPIN_Y": "gesture.y_spin",
  "SPIN_Z": "gesture.z_spin",
  "SHAKE_FB": "gesture.shake_fb",
  "SHAKE_LR": "gesture.shake_lr",
  "SHAKE_UD": "gesture.shake_ud",
  "ORB_CHARGED": "orb_state.charged",
  "ORB_SUPERHEATED": "orb_state.superheated"
}
```

### Actions

```json
{
  "WAKE_WIN": "wake_win",
  "EVENT": "event"
}
```

### Events

```json
{
  "TELEPORT_HOME": "teleport_home",
  "AOE_FLAME": "aoe_flame",
  "AOE_FROST": "aoe_frost",
  "AOE_ELECTRIC": "aoe_electric",
  "GRACE": "grace",
  "ORB_STATE": "orb_state"
}
```

## Authoring Notes

- Add/remove/toggle spells in `spellbook-v2.js`.
- Compose trigger/action chains in `interactions-v2.js`.
- Runtime rule/event/signal wiring is auto-validated in `ready:v2`.
