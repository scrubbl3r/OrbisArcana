import * as THREE from "three";
import { disposeThreeObject } from "../game-runtime/rendering/three/three-object-utils.js";
import { SHOCKWAVE_3D_PRESET_DEFAULT } from "../vfx/presets/shockwave-3d-default.js";

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  const f = Number(fallback);
  const safe = Number.isFinite(n) ? n : (Number.isFinite(f) ? f : min);
  return Math.max(min, Math.min(max, safe));
}

function clampInt(value, min, max, fallback) {
  return Math.round(clampNumber(value, min, max, fallback));
}

function colorHex(config = {}) {
  return (
    (clampInt(config.colorR, 0, 255, SHOCKWAVE_3D_PRESET_DEFAULT.colorR) << 16)
    | (clampInt(config.colorG, 0, 255, SHOCKWAVE_3D_PRESET_DEFAULT.colorG) << 8)
    | clampInt(config.colorB, 0, 255, SHOCKWAVE_3D_PRESET_DEFAULT.colorB)
  ) >>> 0;
}

export function normalizeShockwave3dRuntimeConfig(raw = {}) {
  const source = raw && typeof raw === "object" ? raw : {};
  const fallback = SHOCKWAVE_3D_PRESET_DEFAULT;
  return Object.freeze({
    sphereCount: clampInt(source.sphereCount, 1, 8, fallback.sphereCount),
    spawnMs: clampInt(source.spawnMs, 1, 1000, fallback.spawnMs),
    expandMs: clampInt(source.expandMs, 40, 4000, fallback.expandMs),
    decayMs: clampInt(source.decayMs, 40, 4000, fallback.decayMs),
    startRatio: clampNumber(source.startRatio, 0.01, 10, fallback.startRatio),
    endRatio: clampNumber(source.endRatio, 0.01, 20, fallback.endRatio),
    icoDetail: clampInt(source.icoDetail, 0, 5, fallback.icoDetail),
    fresnelPower: clampNumber(source.fresnelPower, 0.1, 10, fallback.fresnelPower),
    centerAlpha: clampNumber(source.centerAlpha, 0, 1, fallback.centerAlpha),
    rimAlpha: clampNumber(source.rimAlpha, 0, 1, fallback.rimAlpha),
    luminanceBoost: clampNumber(source.luminanceBoost, 0, 4, fallback.luminanceBoost),
    color: colorHex(source),
    colorA: clampNumber(source.colorA, 0, 1, fallback.colorA),
  });
}

function createShockwaveShellMaterial(config = {}) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
    uniforms: {
      uOpacity: { value: 1 },
      uColor: { value: new THREE.Color(config.color || 0xffffff) },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      uniform vec3 uColor;

      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vec3 viewDir = normalize(vViewPosition);
        float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), ${Number(config.fresnelPower).toFixed(3)});
        float alpha = ${Number(config.centerAlpha).toFixed(4)} + fresnel * ${Number(config.rimAlpha).toFixed(3)};
        gl_FragColor = vec4(uColor * ${Number(config.luminanceBoost).toFixed(3)}, alpha * uOpacity);
      }
    `,
  });
}

export function createShockwave3dRuntime({
  getOrbModel = () => null,
  getBo = () => 72,
  getConfig = () => SHOCKWAVE_3D_PRESET_DEFAULT,
  now = () => performance.now(),
  onNeedsFrame = () => {},
} = {}) {
  let raf = 0;
  let group = null;
  let activeConfig = null;
  let startedAtMs = 0;
  let lastTickMs = 0;
  let spawnAcc = 0;
  let spawned = 0;
  let activeSpheres = [];

  function requestFrame() {
    if (typeof onNeedsFrame === "function") onNeedsFrame();
  }

  function clear() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    activeConfig = null;
    lastTickMs = 0;
    spawnAcc = 0;
    spawned = 0;
    activeSpheres = [];
    if (group && group.parent) group.parent.remove(group);
    if (group) disposeThreeObject(group);
    group = null;
    requestFrame();
  }

  function spawnSphere(nowMs) {
    if (!group || !activeConfig) return;
    const bo = Math.max(1, Number(typeof getBo === "function" ? getBo() : getBo) || 72);
    const geometry = new THREE.IcosahedronGeometry(bo * 0.5, activeConfig.icoDetail);
    const material = createShockwaveShellMaterial(activeConfig);
    material.uniforms.uOpacity.value = 0;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = "shockwave_3d:icosphere";
    mesh.renderOrder = 9;
    mesh.scale.setScalar(activeConfig.startRatio);
    group.add(mesh);
    activeSpheres.push({ born: nowMs, mesh, material });
  }

  function tick(nowMs = now()) {
    if (!group || !activeConfig) {
      raf = 0;
      return;
    }
    const currentMs = Number(nowMs) || performance.now();
    const dt = Math.max(0, currentMs - lastTickMs);
    lastTickMs = currentMs;
    spawnAcc += dt;
    while (spawned < activeConfig.sphereCount && spawnAcc >= activeConfig.spawnMs) {
      spawnAcc -= activeConfig.spawnMs;
      spawnSphere(currentMs);
      spawned += 1;
    }
    for (let i = activeSpheres.length - 1; i >= 0; i -= 1) {
      const sphere = activeSpheres[i];
      const age = Math.max(0, currentMs - sphere.born);
      const expandT01 = Math.max(0, Math.min(1, age / activeConfig.expandMs));
      const fadeT01 = Math.max(0, Math.min(1, age / activeConfig.decayMs));
      const scale = activeConfig.startRatio + ((activeConfig.endRatio - activeConfig.startRatio) * expandT01);
      sphere.mesh.scale.setScalar(scale);
      sphere.material.uniforms.uOpacity.value = (fadeT01 <= 0 ? 0 : (1 - fadeT01)) * activeConfig.colorA;
      if (fadeT01 >= 1) {
        group.remove(sphere.mesh);
        disposeThreeObject(sphere.mesh);
        activeSpheres.splice(i, 1);
      }
    }
    requestFrame();
    if (spawned >= activeConfig.sphereCount && activeSpheres.length === 0) {
      clear();
      return;
    }
    raf = requestAnimationFrame(tick);
  }

  function play(payload = {}) {
    clear();
    const baseConfig = typeof getConfig === "function" ? (getConfig() || {}) : {};
    activeConfig = normalizeShockwave3dRuntimeConfig({
      ...baseConfig,
      ...(payload && typeof payload === "object" ? payload : {}),
    });
    const orbModel = typeof getOrbModel === "function" ? getOrbModel() : null;
    if (!orbModel) return { handled: false, skipped: "orb_model_missing" };
    group = new THREE.Group();
    group.name = "shockwave_3d:runtime";
    orbModel.add(group);
    startedAtMs = Number(now()) || performance.now();
    lastTickMs = startedAtMs;
    spawnAcc = activeConfig.spawnMs;
    spawned = 0;
    raf = requestAnimationFrame(tick);
    requestFrame();
    return { handled: true };
  }

  return Object.freeze({
    play,
    trigger: play,
    clear,
    destroy: clear,
    isActive() {
      return !!group || !!raf || activeSpheres.length > 0;
    },
  });
}
