export function disposeThreeObject(object) {
  if (!object || typeof object.traverse !== "function") return;
  const disposedTextures = new Set();
  const disposeMaterial = (material) => {
    if (!material) return;
    [
      "map",
      "alphaMap",
      "aoMap",
      "bumpMap",
      "displacementMap",
      "emissiveMap",
      "envMap",
      "lightMap",
      "metalnessMap",
      "normalMap",
      "roughnessMap",
    ].forEach((key) => {
      const texture = material[key];
      if (texture && typeof texture.dispose === "function" && !disposedTextures.has(texture)) {
        texture.dispose();
        disposedTextures.add(texture);
      }
    });
    if (typeof material.dispose === "function") material.dispose();
  };

  object.traverse((child) => {
    if (child.geometry && typeof child.geometry.dispose === "function") child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach(disposeMaterial);
      else disposeMaterial(child.material);
    }
  });
}

export const disposeObject = disposeThreeObject;

export function applyThreeMeshFlags(object = null, {
  receiveShadow = true,
  castShadow = true,
} = {}) {
  if (!object || typeof object.traverse !== "function") return;
  object.traverse((node) => {
    if (!node || !node.isMesh) return;
    node.receiveShadow = !!receiveShadow;
    node.castShadow = !!castShadow;
  });
}
