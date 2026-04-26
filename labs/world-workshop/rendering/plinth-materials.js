import * as THREE from "three";
import { PLINTH_MATERIAL_CONFIG } from "../configs/plinth-material-config.js?v=20260426a";

export function createLitBlackPlinthMaterial(config = PLINTH_MATERIAL_CONFIG) {
  return new THREE.MeshStandardMaterial({
    color: config.litFaceColor,
    roughness: Number(config.litRoughness),
    metalness: Number(config.litMetalness),
    envMapIntensity: Number(config.litEnvMapIntensity),
    side: THREE.DoubleSide,
  });
}

