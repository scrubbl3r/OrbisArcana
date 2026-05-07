export const AUTHORED_LEVEL_READ_MODEL_KEY_LOOPS = "loops";
export const AUTHORED_LEVEL_READ_MODEL_KEY_SPAWN_POINTS = "spawnPoints";
export const AUTHORED_LEVEL_READ_MODEL_KEY_CAMERA_ANCHORS = "cameraAnchors";
export const AUTHORED_LEVEL_READ_MODEL_KEY_BOUNDARY_BOX = "boundaryBox";
export const AUTHORED_LEVEL_READ_MODEL_KEY_CAMERA_BOUNDARY_BOX = "cameraBoundaryBox";
export const AUTHORED_LEVEL_READ_MODEL_KEY_WORLD_ITEM_SPAWNS = "worldItemSpawns";
export const AUTHORED_LEVEL_READ_MODEL_KEY_PROPS = "props";
export const AUTHORED_LEVEL_READ_MODEL_KEY_ART_SHAPES = "artShapes";
export const AUTHORED_LEVEL_READ_MODEL_KEY_STARS_FIELD_REGIONS = "starsFieldRegions";
export const AUTHORED_LEVEL_READ_MODEL_KEY_DEPTH_LAYERS = "depthLayers";

export function resolveAuthoredLevelReadModel(runtimeOrReadModel = null) {
  const source = runtimeOrReadModel && typeof runtimeOrReadModel === "object" ? runtimeOrReadModel : {};
  return Object.freeze({
    summary: source.currentLevelSummary || source.summary || null,
    sceneModel: source.currentLevelSceneModel || source.sceneModel || null,
    levelGraphicsModel: source.currentLevelGraphicsModel || source.levelGraphicsModel || null,
  });
}

export function resolveAuthoredLevelReadModelArray(runtimeOrReadModel = null, key = "") {
  const readModel = resolveAuthoredLevelReadModel(runtimeOrReadModel);
  if (readModel.sceneModel && Array.isArray(readModel.sceneModel[key])) return readModel.sceneModel[key];
  if (readModel.summary && Array.isArray(readModel.summary[key])) return readModel.summary[key];
  return [];
}

export function resolveAuthoredLevelReadModelBox(runtimeOrReadModel = null, key = "") {
  const readModel = resolveAuthoredLevelReadModel(runtimeOrReadModel);
  if (readModel.sceneModel && readModel.sceneModel[key]) return readModel.sceneModel[key];
  if (readModel.summary && readModel.summary[key]) return readModel.summary[key];
  return null;
}

export function resolveAuthoredLevelReadModelPrimarySpawn(runtimeOrReadModel = null) {
  const readModel = resolveAuthoredLevelReadModel(runtimeOrReadModel);
  if (readModel.sceneModel && readModel.sceneModel.spawn) return readModel.sceneModel.spawn;
  const spawnPoints = resolveAuthoredLevelReadModelArray(readModel, AUTHORED_LEVEL_READ_MODEL_KEY_SPAWN_POINTS);
  return spawnPoints[0] || null;
}

export function resolveAuthoredLevelReadModelSpawn(runtimeOrReadModel = null) {
  const primarySpawn = resolveAuthoredLevelReadModelPrimarySpawn(runtimeOrReadModel);
  if (primarySpawn && primarySpawn.worldCenter) {
    return Object.freeze({
      xW: Number(primarySpawn.worldCenter.xW) || 0,
      yW: Number(primarySpawn.worldCenter.yW) || 0,
    });
  }
  return null;
}
