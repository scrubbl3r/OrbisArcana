import * as THREE from "three";
import { PLINTH_MATERIAL_CONFIG } from "../configs/plinth-material-config.js?v=20260426a";

export function createLitBlackPlinthMaterial(config = PLINTH_MATERIAL_CONFIG) {
  return new THREE.MeshPhysicalMaterial({
    color: config.litFaceColor,
    roughness: Number(config.litRoughness),
    metalness: Number(config.litMetalness),
    envMapIntensity: Number(config.litEnvMapIntensity),
    clearcoat: Number(config.litClearcoat),
    clearcoatRoughness: Number(config.litClearcoatRoughness),
    side: THREE.DoubleSide,
  });
}
