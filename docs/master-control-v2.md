# OrbisArcana Master Control V2

Generated: 2026-03-25T23:45:06.225Z

This document is generated from SSOT:
- wordbook: `src/content/interactions-v2/wordbook-v2.js`
- behavior authoring: `src/content/interactions-v2/dream-config-v2.js`
- compiled orchestrator view: `src/content/interactions-v2/orchestrator-v2.js`

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

## Behavior Authoring (SSOT)

```json
{
  "version": "2",
  "enabled": true,
  "wake": {
    "roots": [
      {
        "id": "root.orbis",
        "words": [
          "orbis"
        ],
        "ttlMs": 2000
      },
      {
        "id": "root.are_kay_nah",
        "words": [
          "are_kay_nah"
        ],
        "ttlMs": 2000
      }
    ]
  },
  "groups": {
    "wake_main_words": [
      "domus",
      "electrum",
      "pyro"
    ],
    "school_words": [
      "rota"
    ]
  },
  "rules": [
    {
      "id": "wake_main",
      "on": {
        "word": "orbis"
      },
      "open": {
        "id": "wake.main",
        "words": [
          "domus",
          "electrum",
          "pyro"
        ],
        "ttlMs": 2000
      }
    },
    {
      "id": "tele_home",
      "on": {
        "word": "domus"
      },
      "requires": "wake.main",
      "trigger": {
        "spell": "teleport_home"
      }
    },
    {
      "id": "electric_aoe",
      "on": {
        "word": "electrum"
      },
      "requires": "wake.main",
      "open": {
        "id": "school.electrum",
        "words": [
          "rota"
        ],
        "ttlMs": 2000
      }
    },
    {
      "id": "electric_aoe_cast",
      "on": {
        "word": "rota"
      },
      "requires": "school.electrum",
      "trigger": {
        "spell": "aoe_electric"
      }
    },
    {
      "id": "spin_y_opens_pyro",
      "on": {
        "spin": "y",
        "orb_state": "charged"
      },
      "open": {
        "id": "school.pyro_spin_seed",
        "words": [
          "pyro"
        ],
        "ttlMs": 2000
      }
    },
    {
      "id": "spin_y_pyro_opens_rota",
      "on": {
        "word": "pyro"
      },
      "requires": "school.pyro_spin_seed",
      "open": {
        "id": "school.pyro_spin",
        "words": [
          "rota"
        ],
        "ttlMs": 2000
      }
    },
    {
      "id": "spin_y_pyro_rota_bind_fb",
      "on": {
        "word": "rota"
      },
      "requires": "school.pyro_spin",
      "bind": {
        "spell": "aoe_flame",
        "slot": "FB"
      }
    },
    {
      "id": "shake_ud_cast",
      "on": {
        "shake": "UD"
      },
      "trigger": {
        "spell": "cast_loaded_ud"
      }
    },
    {
      "id": "shake_lr_cast",
      "on": {
        "shake": "LR"
      },
      "trigger": {
        "spell": "cast_loaded_lr"
      }
    },
    {
      "id": "shake_fb_cast",
      "on": {
        "shake": "FB"
      },
      "trigger": {
        "spell": "cast_loaded_fb"
      }
    }
  ]
}
```

## Orchestrator Defaults (Compiled)

```json
{
  "open": {
    "ttlMs": 2000
  },
  "rule": {
    "cooldownMs": 0,
    "matchWindowMs": 2000,
    "priority": 10
  }
}
```

## Orchestrator Rules (Compiled)

```json
[
  {
    "id": "wake_main",
    "on": {
      "word": "orbis"
    },
    "open": {
      "id": "wake.main",
      "words": [
        "domus",
        "electrum",
        "pyro"
      ],
      "ttlMs": 2000
    }
  },
  {
    "id": "tele_home",
    "on": {
      "word": "domus"
    },
    "requires": "wake.main",
    "trigger": {
      "teleport_home": true
    }
  },
  {
    "id": "electric_aoe",
    "on": {
      "word": "electrum"
    },
    "requires": "wake.main",
    "open": {
      "id": "school.electrum",
      "words": [
        "rota"
      ],
      "ttlMs": 2000
    }
  },
  {
    "id": "electric_aoe_cast",
    "on": {
      "word": "rota"
    },
    "requires": "school.electrum",
    "trigger": {
      "aoe_electric": true
    }
  },
  {
    "id": "spin_y_opens_pyro",
    "on": {
      "spin": "y",
      "orb_state": "charged"
    },
    "open": {
      "id": "school.pyro_spin_seed",
      "words": [
        "pyro"
      ],
      "ttlMs": 2000
    }
  },
  {
    "id": "spin_y_pyro_opens_rota",
    "on": {
      "word": "pyro"
    },
    "requires": "school.pyro_spin_seed",
    "open": {
      "id": "school.pyro_spin",
      "words": [
        "rota"
      ],
      "ttlMs": 2000
    }
  },
  {
    "id": "spin_y_pyro_rota_bind_fb",
    "on": {
      "word": "rota"
    },
    "requires": "school.pyro_spin",
    "bind": {
      "spell": "aoe_flame",
      "slot": "FB"
    }
  },
  {
    "id": "shake_ud_cast",
    "on": {
      "shake": "UD"
    },
    "trigger": {
      "cast_loaded_ud": true
    }
  },
  {
    "id": "shake_lr_cast",
    "on": {
      "shake": "LR"
    },
    "trigger": {
      "cast_loaded_lr": true
    }
  },
  {
    "id": "shake_fb_cast",
    "on": {
      "shake": "FB"
    },
    "trigger": {
      "cast_loaded_fb": true
    }
  }
]
```

## Orchestrator Projection (Derived)

```json
{
  "version": "2",
  "enabled": true,
  "ruleCount": 10,
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
  "SPIN_X": "spin.x",
  "SPIN_Y": "spin.y",
  "SPIN_Z": "spin.z",
  "SHAKE_FB": "shake.fb",
  "SHAKE_LR": "shake.lr",
  "SHAKE_UD": "shake.ud",
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
  "ORB_STATE": "orb_state",
  "CAST_LOADED_UD": "cast_loaded_ud",
  "CAST_LOADED_LR": "cast_loaded_lr",
  "CAST_LOADED_FB": "cast_loaded_fb"
}
```

## Authoring Notes

- Add/remove/toggle words in `wordbook-v2.js`.
- Compose trigger/action chains in `dream-config-v2.js`.
- `orchestrator-v2.js` is compiled output used by runtime/builder validation.
- Runtime rule/event/signal wiring is auto-validated in `ready:v2`.
