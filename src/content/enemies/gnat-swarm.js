export const GNAT_SWARM_ENEMY_DEFAULT = Object.freeze(
{
  "category": "enemy",
  "gnat": {
    "idle": {
      "baseSpeedBoPerSec": 1,
      "elasticJitterBo": 0.12,
      "elasticJitterHz": 9,
      "idleRadiusBo": 3,
      "maxSpeedBoPerSec": 5,
      "springDamping": 2,
      "springStiffness": 4,
      "targetJitterBo": 3,
      "targetRetargetMaxSec": 2,
      "targetRetargetMinSec": 0.1
    },
    "personalityRanges": {
      "aggression": [
        0.08,
        0.36
      ],
      "awareness": [
        0.24,
        0.82
      ],
      "arrivalRadiusBo": [
        0.34,
        0.34
      ],
      "lingerSec": [
        3,
        3
      ],
      "outboundBias": [
        0.64,
        0.64
      ],
      "returnBias": [
        0.7,
        0.7
      ],
      "returnSpeedMultiplier": [
        0,
        0
      ],
      "speed": [
        20,
        20
      ],
      "wanderChancePerMinute": [
        25,
        25
      ],
      "wanderCooldownSec": [
        3,
        3
      ],
      "wanderRangeBo": [
        10,
        10
      ]
    }
  },
  "id": "gnat-swarm",
  "kind": "swarm",
  "label": "Gnat Swarm",
  "member": "gnat",
  "status": "draft"
}
);
