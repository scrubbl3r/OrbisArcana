# OrbisArcana Master Control V2

Generated: 2026-03-30T23:57:49.118Z

This document is generated from SSOT:
- wordbook: `src/content/interactions-v2/wordbook-v2.js`
- behavior authoring: `src/content/interactions-v2/interaction-graph-v2.js`
- compiled interaction graph view: `src/content/interactions-v2/compiled-interaction-graph-v2.js`

## Runtime Flags

- compiledInteractionGraphEnabled: true

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
      "label": "Arcana",
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
        "ttlMs": 1500
      },
      {
        "id": "root.are_kay_nah",
        "words": [
          "are_kay_nah"
        ],
        "ttlMs": 1500
      }
    ]
  },
  "groups": {
    "wake_main_words": [
      "domus",
      "electrum",
      "pyro"
    ],
    "electrum_chain_words": [
      "rota"
    ],
    "wake_are_kay_nah_words": [
      "pyro",
      "vectus"
    ],
    "pyro_voice_chain_words": [
      "sanctum",
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
        "ttlMs": 1500
      }
    },
    {
      "id": "tele_home",
      "on": {
        "word": "domus"
      },
      "requires": "wake.main",
      "trigger": {
        "spell": "teleport"
      }
    },
    {
      "id": "electric_aoe",
      "on": {
        "word": "electrum"
      },
      "requires": "wake.main",
      "open": {
        "id": "chain.electrum",
        "words": [
          "rota"
        ],
        "ttlMs": 1500
      }
    },
    {
      "id": "electric_aoe_cast",
      "on": {
        "word": "rota"
      },
      "requires": "chain.electrum",
      "trigger": {
        "spell": "aoe_electric"
      }
    },
    {
      "id": "wake_are_kay_nah",
      "on": {
        "word": "are_kay_nah"
      },
      "open": {
        "id": "wake.are_kay_nah",
        "words": [
          "pyro",
          "vectus"
        ],
        "ttlMs": 1500
      }
    },
    {
      "id": "pyro_voice_chain",
      "on": {
        "word": "pyro"
      },
      "requires": "wake.are_kay_nah",
      "open": {
        "id": "chain.pyro_voice",
        "words": [
          "sanctum",
          "rota"
        ],
        "ttlMs": 1500
      }
    },
    {
      "id": "pyro_sanctum_cast",
      "on": {
        "word": "sanctum"
      },
      "requires": "chain.pyro_voice",
      "trigger": {
        "spell": "bubble_shield"
      }
    },
    {
      "id": "pyro_rota_cast",
      "on": {
        "word": "rota"
      },
      "requires": "chain.pyro_voice",
      "trigger": {
        "spell": "aoe_flame"
      }
    },
    {
      "id": "spin_x_colorize",
      "on": {
        "spin": "x"
      },
      "trigger": {
        "spell": {
          "id": "colorize",
          "args": {
            "r": 0,
            "g": 100,
            "b": 253,
            "alpha": 0.2
          }
        }
      }
    },
    {
      "id": "spin_z_colorize",
      "on": {
        "spin": "z"
      },
      "trigger": {
        "spell": {
          "id": "colorize",
          "args": {
            "r": 253,
            "g": 241,
            "b": 0,
            "alpha": 0.2
          }
        }
      }
    },
    {
      "id": "spin_y_opens_pyro",
      "on": {
        "spin": "y"
      },
      "trigger": {
        "spell": {
          "id": "colorize",
          "args": {
            "r": 253,
            "g": 78,
            "b": 0,
            "alpha": 0.2
          }
        }
      },
      "open": {
        "id": "chain.spin_y_seed",
        "words": [
          "pyro"
        ],
        "ttlMs": 1500
      }
    },
    {
      "id": "spin_y_pyro_opens_vectus",
      "on": {
        "word": "pyro"
      },
      "requires": "chain.spin_y_seed",
      "open": {
        "id": "chain.spin_y_loaded",
        "words": [
          "vectus"
        ],
        "ttlMs": 1500
      }
    },
    {
      "id": "spin_y_pyro_vectus_bind_fb",
      "on": {
        "word": "vectus"
      },
      "requires": "chain.spin_y_loaded",
      "bind": {
        "spell": "bubble_shield",
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

## Compiled Interaction Graph Defaults

```json
{
  "open": {
    "ttlMs": 1500
  },
  "rule": {
    "cooldownMs": 0,
    "matchWindowMs": 2000,
    "priority": 10
  }
}
```

## Compiled Interaction Graph Rules

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
      "ttlMs": 1500
    }
  },
  {
    "id": "tele_home",
    "on": {
      "word": "domus"
    },
    "requires": "wake.main",
    "trigger": {
      "teleport": true
    }
  },
  {
    "id": "electric_aoe",
    "on": {
      "word": "electrum"
    },
    "requires": "wake.main",
    "open": {
      "id": "chain.electrum",
      "words": [
        "rota"
      ],
      "ttlMs": 1500
    }
  },
  {
    "id": "electric_aoe_cast",
    "on": {
      "word": "rota"
    },
    "requires": "chain.electrum",
    "trigger": {
      "aoe_electric": true
    }
  },
  {
    "id": "wake_are_kay_nah",
    "on": {
      "word": "are_kay_nah"
    },
    "open": {
      "id": "wake.are_kay_nah",
      "words": [
        "pyro",
        "vectus"
      ],
      "ttlMs": 1500
    }
  },
  {
    "id": "pyro_voice_chain",
    "on": {
      "word": "pyro"
    },
    "requires": "wake.are_kay_nah",
    "open": {
      "id": "chain.pyro_voice",
      "words": [
        "sanctum",
        "rota"
      ],
      "ttlMs": 1500
    }
  },
  {
    "id": "pyro_sanctum_cast",
    "on": {
      "word": "sanctum"
    },
    "requires": "chain.pyro_voice",
    "trigger": {
      "bubble_shield": true
    }
  },
  {
    "id": "pyro_rota_cast",
    "on": {
      "word": "rota"
    },
    "requires": "chain.pyro_voice",
    "trigger": {
      "aoe_flame": true
    }
  },
  {
    "id": "spin_x_colorize",
    "on": {
      "spin": "x"
    },
    "trigger": {
      "colorize": {
        "r": 0,
        "g": 100,
        "b": 253,
        "alpha": 0.2
      }
    }
  },
  {
    "id": "spin_z_colorize",
    "on": {
      "spin": "z"
    },
    "trigger": {
      "colorize": {
        "r": 253,
        "g": 241,
        "b": 0,
        "alpha": 0.2
      }
    }
  },
  {
    "id": "spin_y_opens_pyro",
    "on": {
      "spin": "y"
    },
    "trigger": {
      "colorize": {
        "r": 253,
        "g": 78,
        "b": 0,
        "alpha": 0.2
      }
    },
    "open": {
      "id": "chain.spin_y_seed",
      "words": [
        "pyro"
      ],
      "ttlMs": 1500
    }
  },
  {
    "id": "spin_y_pyro_opens_vectus",
    "on": {
      "word": "pyro"
    },
    "requires": "chain.spin_y_seed",
    "open": {
      "id": "chain.spin_y_loaded",
      "words": [
        "vectus"
      ],
      "ttlMs": 1500
    }
  },
  {
    "id": "spin_y_pyro_vectus_bind_fb",
    "on": {
      "word": "vectus"
    },
    "requires": "chain.spin_y_loaded",
    "bind": {
      "spell": "bubble_shield",
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

## Compiled Interaction Graph Projection

```json
{
  "version": "2",
  "enabled": true,
  "ruleCount": 16,
  "parityWithCompiledInteractionGraphRuleCount": true
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
  "ORB_GLOBE_LOADED": "orb_state.globe_loaded",
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
  "TELEPORT": "teleport",
  "SHOCKWAVE": "shockwave",
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
- Compose trigger/action chains in `interaction-graph-v2.js`.
- `compiled-interaction-graph-v2.js` is compiled output used by runtime/builder validation.
- Runtime rule/event/signal wiring is auto-validated in `ready:v2`.
