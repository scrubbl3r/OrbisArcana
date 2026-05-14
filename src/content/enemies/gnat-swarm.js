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
      "targetRetargetMaxSec": 3,
      "targetRetargetMinSec": 0.5
    },
    "personalityRanges": {
      "aggression": [
        0.08,
        0.36
      ],
      "arrivalRadiusBo": [
        1,
        1
      ],
      "awareness": [
        0.24,
        0.82
      ],
      "lingerSec": [
        3,
        3
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
        0.6,
        0.95
      ],
      "segmentDwellSec": [
        0,
        3
      ],
      "speed": [
        0.5,
        0.5
      ],
      "wanderChancePerMinute": [
        0,
        1
      ],
      "wanderCooldownSec": [
        3,
        3
      ],
      "wanderRangeBo": [
        10,
        10
      ],
      "wanderSegmentJitterBo": [
        0.5,
        2
      ],
      "wanderSegmentSpacingBo": [
        2,
        6
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
    "gnatsTotal": 10,
    "spawnCurves": {
      "wanderChancePerMinute": {
        "amount": 0.2,
        "bias": 0
      }
    },
    "spawnRadiusBo": 2
  }
}
);
