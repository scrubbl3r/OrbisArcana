export const GNAT_SWARM_ENEMY_DEFAULT = Object.freeze(
{
  "category": "enemy",
  "gnat": {
    "idle": {
      "elasticJitterBo": [
        1,
        1
      ],
      "elasticJitterHz": [
        1,
        1
      ],
      "springDamping": [
        4,
        4
      ],
      "springStiffness": [
        9,
        9
      ],
      "targetJitterBo": [
        10,
        10
      ],
      "targetRetargetMaxSec": [
        20,
        20
      ],
      "targetRetargetMinSec": [
        5,
        5
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
        3
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
        3
      ],
      "speed": [
        0.5,
        0.2
      ],
      "wanderChancePerMinute": [
        0,
        1.25
      ],
      "wanderCooldownSec": [
        10,
        30
      ],
      "wanderRangeBo": [
        10,
        50
      ],
      "wanderSegmentJitterBo": [
        0,
        0
      ],
      "wanderSegmentSpacingBo": [
        0.5,
        3
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
      10,
      10
    ],
    "gnatSizeBo": 0.04,
    "gnatsTotal": 40,
    "spawnCurves": {
      "wanderChancePerMinute": {
        "amount": 1,
        "bias": 1
      },
      "wanderRangeBo": {
        "amount": 0,
        "bias": 0
      }
    },
    "spawnRadiusBo": 1.5,
    "zDepthBo": 0
  }
}
);
