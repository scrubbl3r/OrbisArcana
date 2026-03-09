export const SPELLS = [
  {
    active: false,
    id: "orbis",
    phrase: "orbis",
    onnxModel: "orbis",
    minConfidence: 0.6,
    cooldownMs: 0,
  },
  {
    active: true,
    id: "domus",
    phrase: "domus",
    onnxModel: "domus",
    minConfidence: 0.62,
    cooldownMs: 250,
  },
  {
    active: true,
    id: "tempus",
    phrase: "tempus",
    onnxModel: "tempus",
    minConfidence: 0.6,
    cooldownMs: 0,
  },
  {
    active: true,
    id: "fridgis",
    phrase: "fridgis",
    onnxModel: "fridgis",
    minConfidence: 0.6,
    cooldownMs: 0,
  },
  {
    active: true,
    id: "electrum",
    phrase: "electrum",
    onnxModel: "electrum",
    minConfidence: 0.6,
    cooldownMs: 0,
  },
  {
    active: true,
    id: "sanctum",
    phrase: "sanctum",
    onnxModel: "sanctum",
    minConfidence: 0.6,
    cooldownMs: 0,
  },
  {
    active: true,
    id: "vectus",
    phrase: "vectus",
    onnxModel: "vectus",
    minConfidence: 0.6,
    cooldownMs: 0,
  },
  {
    active: true,
    id: "rota",
    phrase: "rota",
    onnxModel: "rota",
    minConfidence: 0.6,
    cooldownMs: 0,
  },
];

export const SPELLS_BY_ID = Object.freeze(
  SPELLS.reduce((acc, s) => {
    const id = String(s && s.id || "").toLowerCase();
    if (!id) return acc;
    acc[id] = s;
    return acc;
  }, {})
);

export const ACTIVE_SPELLS = Object.freeze(
  SPELLS.filter((s) => s && s.active !== false)
);

export const ACTIVE_SPELLS_BY_ID = Object.freeze(
  ACTIVE_SPELLS.reduce((acc, s) => {
    const id = String(s && s.id || "").toLowerCase();
    if (!id) return acc;
    acc[id] = s;
    return acc;
  }, {})
);
