export const GNAT_SWARM_ENEMY_DEFAULT = Object.freeze(
{
  "category": "enemy",
  "gnat": {
    "idle": {
      "baseSpeedBoPerSec": 1.35,
      "elasticJitterBo": 0.12,
      "elasticJitterHz": 9,
      "idleRadiusBo": 2.2,
      "maxSpeedBoPerSec": 3.2,
      "springDamping": 6.5,
      "springStiffness": 18,
      "targetJitterBo": 0.42,
      "targetRetargetMaxSec": 1.25,
      "targetRetargetMinSec": 0.28
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
      "chancePerMinute": 16,
      "commitment": 0.62,
      "cooldownMaxSec": 5.5,
      "cooldownMinSec": 1.4,
      "lingerMaxSec": 2.2,
      "lingerMinSec": 0.4,
      "loopiness": 0.58,
      "outboundSkew": 0.48,
      "rangeMaxBo": 5.8,
      "rangeMinBo": 2.8,
      "returnSkew": 0.72,
      "returnSpeedMultiplier": 1.12
    }
  },
  "id": "gnat-swarm",
  "kind": "swarm",
  "label": "Gnat Swarm",
  "member": "gnat",
  "status": "draft"
}
);
