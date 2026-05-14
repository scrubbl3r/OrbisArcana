export const GNAT_SWARM_ENEMY_DEFAULT = Object.freeze(
{
  "category": "enemy",
  "gnat": {
    "idle": {
      "elasticJitterBo": [
        0.5,
        0.5
      ],
      "elasticJitterHz": [
        0,
        2
      ],
      "springDamping": [
        10,
        10
      ],
      "springStiffness": [
        8,
        8
      ],
      "targetJitterBo": [
        4,
        4
      ],
      "targetRetargetMaxSec": [
        5,
        5
      ],
      "targetRetargetMinSec": [
        0.5,
        0.5
      ]
    },
    "personalityRanges": {
      "aggression": [
        0.08,
        0.36
      ],
      "arrivalRadiusBo": [
        1,
        4
      ],
      "awareness": [
        0.24,
        0.82
      ],
      "lingerSec": [
        0,
        8
      ],
      "returnBias": [
        0.6,
        1
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
        5
      ],
      "speed": [
        0.8,
        3
      ],
      "wanderChancePerMinute": [
        0,
        0.5
      ],
      "wanderCooldownSec": [
        5,
        20
      ],
      "wanderRangeBo": [
        30,
        55
      ],
      "wanderSegmentJitterBo": [
        0,
        2
      ],
      "wanderSegmentSpacingBo": [
        0.5,
        5
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
      5,
      5
    ],
    "gnatSizeBo": 0.02,
    "gnatsTotal": 40,
    "spawnCurves": {
      "wanderChancePerMinute": {
        "amount": 0,
        "bias": 0
      },
      "wanderRangeBo": {
        "amount": 0,
        "bias": 0
      }
    },
    "spawnRadiusBo": 0.3,
    "zDepthBo": 0
  }
}
);
