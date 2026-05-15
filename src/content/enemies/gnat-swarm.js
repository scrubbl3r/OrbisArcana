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
      "targetRetargetMaxSec": 5,
      "targetRetargetMinSec": 0.5
    },
    "personalityRanges": {
      "aggression": [
        0.5,
        1.2
      ],
      "arrivalRadiusBo": [
        1,
        4
      ],
      "awareness": [
        0.01,
        0.25
      ],
      "lingerSec": [
        0,
        5
      ],
      "returnBias": [
        0.2,
        0.5
      ],
      "returnSegmentSpacingBo": [
        2,
        6
      ],
      "returnSpeedMultiplier": [
        0.5,
        1
      ],
      "routeCommitment": [
        0.5,
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
        2
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
    "baseSpeedBoPerSec": 5,
    "detectionBaseChance": 0.1,
    "detectionCheckSec": 1,
    "detectionRadiusBo": 5,
    "feedLatchDrift": 0.007,
    "feedMigrationBoPerSec": 0.5,
    "feedMigrationRetargetSec": [
      1,
      6
    ],
    "feedNipDepthBo": 0.24,
    "feedNipHz": 7,
    "feedOffsetBo": 0.08,
    "feedStickiness": 0.42,
    "gnatSizeBo": 0.02,
    "gnatsTotal": 40,
    "leashChaseBo": 10,
    "leashFeedBo": [
      20,
      20
    ],
    "minSignalStrength": 0.08,
    "signalBaseChance": 0.75,
    "signalCooldownSec": 1,
    "signalDecay": 0.15,
    "signalHops": 4,
    "signalMemorySec": 1.6,
    "signalRadiusBo": 15,
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
