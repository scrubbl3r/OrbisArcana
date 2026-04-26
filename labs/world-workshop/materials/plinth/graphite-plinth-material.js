import * as THREE from "three";
import { GRAPHITE_PLINTH_MATERIAL_CONFIG } from "./graphite-plinth-config.js?v=20260426a";

function createGraphiteSurfaceTexture(config = GRAPHITE_PLINTH_MATERIAL_CONFIG) {
  if (typeof document === "undefined") return null;

  const size = Math.max(16, Number(config.litTextureSize) || 96);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const image = context.createImageData(size, size);
  for (let index = 0; index < image.data.length; index += 4) {
    const pixel = index / 4;
    const x = pixel % size;
    const y = Math.floor(pixel / size);
    const grain = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    const value = 112 + Math.round((grain - Math.floor(grain)) * 28);
    image.data[index] = value;
    image.data[index + 1] = value;
    image.data[index + 2] = value;
    image.data[index + 3] = 255;
  }
  context.putImageData(image, 0, 0);

  context.globalAlpha = 0.22;
  for (let y = 0; y < size; y += 3) {
    context.fillStyle = y % 2 ? "#ffffff" : "#000000";
    context.fillRect(0, y, size, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(Number(config.litTextureRepeat) || 5, Number(config.litTextureRepeat) || 5);
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function createGraphitePlinthMaterial(config = GRAPHITE_PLINTH_MATERIAL_CONFIG) {
  const surfaceTexture = createGraphiteSurfaceTexture(config);
  const material = new THREE.MeshPhysicalMaterial({
    color: config.litFaceColor,
    roughness: Number(config.litRoughness),
    metalness: Number(config.litMetalness),
    envMapIntensity: Number(config.litEnvMapIntensity),
    clearcoat: Number(config.litClearcoat),
    clearcoatRoughness: Number(config.litClearcoatRoughness),
    specularIntensity: Number(config.litSpecularIntensity),
    specularColor: config.litSpecularColor,
    side: THREE.DoubleSide,
  });
  if (surfaceTexture) {
    material.roughnessMap = surfaceTexture;
    material.bumpMap = surfaceTexture;
    material.bumpScale = Number(config.litBumpScale) || 0;
  }
  return material;
}

export const createLitBlackPlinthMaterial = createGraphitePlinthMaterial;
