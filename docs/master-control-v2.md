# OrbisArcana Master Control V2

Generated: 2026-03-23T07:10:33.585Z

This document is generated from SSOT:
- wordbook: `src/content/interactions-v2/wordbook-v2.js`
  - compatibility alias: `src/content/interactions-v2/spellbook-v2.js`
- orchestrator: `src/content/interactions-v2/orchestrator-v1.js`

## Runtime Flags

- orchestratorEnabled: true

## Wordbook (SSOT)

```json
{
  "version": "2",
  "words": [
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

## Orchestrator Defaults (SSOT)

```json
{
  "open": {
    "ttlMs": 2000
  },
  "trigger": {
    "grace": {
      "ms": 500
    }
  }
}
```

## Orchestrator Rules (SSOT)

```json
[
  {
    "id": "r_domus_immediate",
    "on": {
      "word": "domus"
    },
    "trigger": {
      "teleport_home": true
    }
  },
  {
    "id": "r_rota_yspin_charged",
    "on": {
      "word": "rota",
      "gesture": "spin_y",
      "orb_state": "charged"
    },
    "open": [
      "rota",
      "sanctum",
      "vectus"
    ],
    "trigger": {
      "aoe_electric": {
        "range": 14
      },
      "grace": true,
      "orb_state": {
        "state": "superheated"
      }
    }
  }
]
```

## Orchestrator Projection (Derived)

```json
{
  "version": "1",
  "enabled": true,
  "ruleCount": 2,
  "parityWithOrchestratorRuleCount": true
}
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
  "SPIN_X": "gesture.spin_x",
  "SPIN_Y": "gesture.spin_y",
  "SPIN_Z": "gesture.spin_z",
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

- Add/remove/toggle words in `wordbook-v2.js`.
  - compatibility alias path: `spellbook-v2.js`
- Compose trigger/action chains in `orchestrator-v1.js`.
- Runtime rule/event/signal wiring is auto-validated in `ready:v2`.
