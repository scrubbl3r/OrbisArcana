export const GNAT_SWARM_ENEMY_DEFAULT = Object.freeze(
{
  "category": "enemy",
  "gnat": {
    "idle": {
      "baseSpeedBoPerSec": 1,
      "elasticJitterBo": 0.12,
      "elasticJitterHz": 9,
      "idleRadiusBo": 5,
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
      "speed": [
        20,
        20
      ],
      "wanderChance": [
        0.42,
        1.62
      ],
      "wanderRange": [
        0.76,
        1.34
      ]
    },
    "wander": {
      "arrivalRadiusBo": 0.34,
      "chancePerMinute": 25,
      "cooldownMaxSec": 2,
      "cooldownMinSec": 0,
      "elasticJitterBo": 0.18,
      "elasticJitterHz": 7.5,
      "lingerMaxSec": 2.2,
      "lingerMinSec": 0.4,
      "outboundBias": 0.25,
      "rangeMaxBo": 10,
      "rangeMinBo": 5,
      "returnBias": 0.72,
      "returnSpeedMultiplier": 1.12,
      "springDamping": 5.2,
      "springStiffness": 12,
      "targetJitterBo": 0.54,
      "targetRetargetMaxSec": 1.8,
      "targetRetargetMinSec": 0.35
    }
  },
  "id": "gnat-swarm",
  "kind": "swarm",
  "label": "Gnat Swarm",
  "member": "gnat",
  "status": "draft"
}
);
