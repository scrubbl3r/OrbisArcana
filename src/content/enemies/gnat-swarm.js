export const GNAT_SWARM_ENEMY_DEFAULT = Object.freeze(
{
  "category": "enemy",
  "gnat": {
    "idle": {
      "baseSpeedBoPerSec": 150,
      "elasticJitterBo": 0.12,
      "elasticJitterHz": 9,
      "idleRadiusBo": 2,
      "maxSpeedBoPerSec": 200,
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
        0.5,
        0.82
      ],
      "returnSpeedMultiplier": [
        0.5,
        1
      ],
      "speed": [
        150,
        200
      ],
      "routeCommitment": [
        0.4,
        0.75
      ],
      "wanderChancePerMinute": [
        0,
        1
      ],
      "wanderCooldownSec": [
        1.4,
        5.5
      ],
      "wanderRangeBo": [
        3,
        12
      ],
      "wanderStopJitterBo": [
        0.5,
        2
      ],
      "wanderStopSpacingBo": [
        3,
        7
      ]
    }
  },
  "id": "gnat-swarm",
  "kind": "swarm",
  "label": "Gnat Swarm",
  "member": "gnat",
  "status": "draft",
  "swarm": {
    "gnatsTotal": 40
  }
}
);
