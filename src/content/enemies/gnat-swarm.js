export const GNAT_SWARM_ENEMY_DEFAULT = Object.freeze(
{
  "category": "enemy",
  "gnat": {
    "idle": {
      "elasticJitterBo": 0.12,
      "elasticJitterHz": 9,
      "springDamping": 3,
      "springStiffness": 8,
      "targetJitterBo": 3,
      "targetRetargetMaxSec": 4,
      "targetRetargetMinSec": 1.5
    },
    "personalityRanges": {
      "aggression": [
        0.08,
        0.36
      ],
      "arrivalRadiusBo": [
        0.34,
        0.34
      ],
      "awareness": [
        0.24,
        0.82
      ],
      "lingerSec": [
        0.4,
        5
      ],
      "returnBias": [
        0.2,
        0.2
      ],
      "returnSpeedMultiplier": [
        0.5,
        1
      ],
      "routeCommitment": [
        0.7,
        0.95
      ],
      "speed": [
        0.5,
        0.5
      ],
      "wanderChancePerMinute": [
        60,
        1
      ],
      "wanderCooldownSec": [
        3,
        3
      ],
      "wanderRangeBo": [
        10,
        20
      ],
      "wanderStopJitterBo": [
        0.5,
        2
      ],
      "wanderStopSpacingBo": [
        1,
        4
      ]
    }
  },
  "id": "gnat-swarm",
  "kind": "swarm",
  "label": "Gnat Swarm",
  "member": "gnat",
  "status": "draft",
  "swarm": {
    "baseSpeedBoPerSec": [
      100,
      100
    ],
    "gnatsTotal": 1,
    "spawnRadiusBo": 2
  }
}
);
