import * as THREE from "three";
import { createWorldObjectInspector } from "../../world-workshop/inspectors/world-object-inspector.js?v=20260426a";
import { ORB_BLOOM_CONFIG } from "../../world-workshop/effects/bloom/bloom-config.js?v=20260426a";
import { createOrbModel } from "../../../src/game-runtime/orb/orb-3d-model.js?v=20260428a";
import {
  createOpalescentOrbShellMaterial,
  createOrbPointLight,
  updateOrbPointLight,
} from "../../../src/game-runtime/orb/orb-3d-material.js?v=20260428a";
import { ORB_3D_VISUAL_DEFAULTS } from "../../../src/game-runtime/orb/orb-3d-default.js?v=20260517a";

const ORB_RADIUS_BO = 0.5;
const MAX_HALO_BOLTS = 32;

function frameCameraToSsotOrbSize(inspector, root, bo) {
  if (!inspector || !inspector.camera || !root) return;
  const bounds = root.getBoundingClientRect();
  const viewportHeight = Math.max(1, Number(bounds.height) || 1);
  const camera = inspector.camera;
  const fovRadians = (Number(camera.fov) || 45) * Math.PI / 180;
  const distance = viewportHeight / (2 * Math.tan(fovRadians * 0.5));
  camera.position.set(0, 0, distance);
  camera.near = Math.max(0.1, bo * 0.05);
  camera.far = Math.max(2000, distance + bo * 20);
  camera.updateProjectionMatrix();
  if (inspector.controls) {
    inspector.controls.target.set(0, 0, 0);
    inspector.controls.minDistance = Math.max(bo * 0.75, distance * 0.35);
    inspector.controls.maxDistance = Math.max(bo * 12, distance * 3);
    inspector.controls.update();
  }
}

function clampNumber(value, min, max, fallback) {
  const numeric = Number(value);
  const safe = Number.isFinite(numeric) ? numeric : Number(fallback);
  return Math.max(min, Math.min(max, Number.isFinite(safe) ? safe : min));
}

function readInputNumber(el, fallback, min = -Infinity, max = Infinity) {
  return clampNumber(el && el.value, min, max, fallback);
}

function readInputBoolean(el, fallback = true) {
  if (!el) return !!fallback;
  return !!el.checked;
}

function rgbColor(r = 255, g = 255, b = 255) {
  return new THREE.Color(
    clampNumber(r, 0, 255, 255) / 255,
    clampNumber(g, 0, 255, 255) / 255,
    clampNumber(b, 0, 255, 255) / 255
  );
}

function disposeObject(object) {
  if (!object) return;
  object.traverse((child) => {
    if (child.geometry && typeof child.geometry.dispose === "function") child.geometry.dispose();
    if (child.material && typeof child.material.dispose === "function") {
      if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose && material.dispose());
      else child.material.dispose();
    }
  });
}

function buildLightningFieldUniformValues({
  boltCount,
  startMin,
  startMax,
  endMin,
  endMax,
  bo,
  boltColor,
  lineWidth,
  intensity,
  tipFade,
  flickerHz,
  flickerDepth,
  noiseScale,
  noiseStrength,
  noiseSpeed,
  time,
}) {
  const count = Math.max(0, Math.min(MAX_HALO_BOLTS, Math.round(Number(boltCount) || 0)));
  return {
    uBoltCount: count,
    uBo: Math.max(1, bo),
    uTime: time,
    uStartMin: startMin,
    uStartMax: Math.max(startMin, startMax),
    uEndMin: endMin,
    uEndMax: Math.max(endMin, endMax),
    uBoltColor: boltColor,
    uLineWidth: Math.max(0.001, lineWidth),
    uIntensity: clampNumber(intensity, 0, 20, 6),
    uTipFade: clampNumber(tipFade, 0, 1, 0.08),
    uFlickerHz: clampNumber(flickerHz, 0, 60, 4),
    uFlickerDepth: clampNumber(flickerDepth, 0, 1, 0.5),
    uNoiseScale: clampNumber(noiseScale, 0.1, 200, 20),
    uNoiseStrength: clampNumber(noiseStrength, 0, 0.5, 0.03),
    uNoiseSpeed: clampNumber(noiseSpeed, 0, 20, 3),
  };
}

function updateLightningFieldMaterial(material, params) {
  if (!material || !material.uniforms) return;
  const values = buildLightningFieldUniformValues(params);
  Object.entries(values).forEach(([key, value]) => {
    if (!material.uniforms[key]) material.uniforms[key] = { value };
    else material.uniforms[key].value = value;
  });
}

function createLightningFieldMaterial(params) {
  const values = buildLightningFieldUniformValues(params);
  return new THREE.ShaderMaterial({
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    toneMapped: false,
    uniforms: {
      uBoltCount: { value: values.uBoltCount },
      uBo: { value: values.uBo },
      uTime: { value: values.uTime },
      uStartMin: { value: values.uStartMin },
      uStartMax: { value: values.uStartMax },
      uEndMin: { value: values.uEndMin },
      uEndMax: { value: values.uEndMax },
      uBoltColor: { value: values.uBoltColor },
      uLineWidth: { value: values.uLineWidth },
      uIntensity: { value: values.uIntensity },
      uTipFade: { value: values.uTipFade },
      uFlickerHz: { value: values.uFlickerHz },
      uFlickerDepth: { value: values.uFlickerDepth },
      uNoiseScale: { value: values.uNoiseScale },
      uNoiseStrength: { value: values.uNoiseStrength },
      uNoiseSpeed: { value: values.uNoiseSpeed },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      #define MAX_HALO_BOLTS ${MAX_HALO_BOLTS}
      uniform int uBoltCount;
      uniform float uBo;
      uniform float uTime;
      uniform float uStartMin;
      uniform float uStartMax;
      uniform float uEndMin;
      uniform float uEndMax;
      uniform vec3 uBoltColor;
      uniform float uLineWidth;
      uniform float uIntensity;
      uniform float uTipFade;
      uniform float uFlickerHz;
      uniform float uFlickerDepth;
      uniform float uNoiseScale;
      uniform float uNoiseStrength;
      uniform float uNoiseSpeed;
      varying vec3 vWorldPosition;

      mat2 rotate2(float angle) {
        float c = cos(angle);
        float s = sin(angle);
        return mat2(c, -s, s, c);
      }

      float randomFloat(vec2 seed) {
        seed = sin(seed * vec2(123.45, 546.23)) * 345.21 + 12.57;
        return fract(seed.x * seed.y);
      }

      float simpleNoise(vec2 uv, float octaves) {
        float sn = 0.0;
        float amplitude = 1.0;
        float deno = 0.0;
        octaves = clamp(octaves, 1.0, 6.0);
        for (float i = 1.0; i <= 6.0; i += 1.0) {
          if (i > octaves) break;
          vec2 grid = smoothstep(vec2(0.0), vec2(1.0), fract(uv));
          vec2 id = floor(uv);
          vec2 offs = vec2(0.0, 1.0);
          float bl = randomFloat(id);
          float br = randomFloat(id + offs.yx);
          float tl = randomFloat(id + offs);
          float tr = randomFloat(id + offs.yy);
          sn += mix(mix(bl, br, grid.x), mix(tl, tr, grid.x), grid.y) * amplitude;
          deno += amplitude;
          uv *= 3.5;
          amplitude *= 0.5;
        }
        return sn / max(0.0001, deno);
      }

      float lineSdf(vec2 p, vec2 a, vec2 b, float width, out float h) {
        vec2 pa = p - a;
        vec2 ba = b - a;
        h = clamp(dot(pa, ba) / max(0.00001, dot(ba, ba)), 0.0, 1.0);
        return length(pa - ba * h) - width;
      }

      vec3 proceduralBolt(vec2 p, float angle, float startR, float len, float seed) {
        vec2 uv = rotate2(angle) * p;
        uv.y -= startR;
        vec2 t = vec2(0.0, mod(uTime, 200.0) * 2.0);

        float h = 0.0;
        float sn = simpleNoise(uv / max(1.0, uBo) * uNoiseScale - t * uNoiseSpeed + vec2(seed * 1.5, 0.0), 2.0) * 2.0 - 1.0;
        uv.x += sn * uBo * uNoiseStrength * smoothstep(0.0, uBo * 0.2, abs(uv.y));
        float d = lineSdf(uv, vec2(0.0, 0.0), vec2(0.0, len), uLineWidth * 0.006, h);
        float line = 0.1 / max(max(d / max(1.0, uBo), 0.0), 0.0001);
        vec3 bolt = clamp(1.0 - exp(-(line * uBoltColor) * 0.02), 0.0, 1.0);
        bolt *= smoothstep(len, len * (1.0 - uTipFade), abs(uv.y));

        float flicker = 1.0 - uFlickerDepth * (0.5 + 0.5 * sin(uTime * uFlickerHz * 6.2831853 + seed * 2.31));
        return bolt * flicker;
      }

      void main() {
        vec2 p = vWorldPosition.xy;
        vec3 color = vec3(0.0);
        float activeCount = floor(randomFloat(vec2(floor(uTime / 0.2))) * max(1.0, float(uBoltCount) - 1.0) + 1.5);
        float lengthMin = max(uLineWidth * 6.0, uEndMin - uStartMax);
        float lengthMax = max(lengthMin, uEndMax - uStartMin);
        for (int i = 0; i < MAX_HALO_BOLTS; i += 1) {
          if (float(i) >= activeCount) break;
          float fi = float(i);
          float seed = fi * 37.13 + floor(uTime / 0.2) * 19.7 + 11.7;
          float angle = randomFloat(vec2(seed, activeCount + 3.17)) * 6.2831853;
          float startR = mix(uStartMin, uStartMax, randomFloat(vec2(seed, 7.0)));
          float len = mix(lengthMin, lengthMax, randomFloat(vec2(angle, seed)));
          color += proceduralBolt(p, angle, startR, len, seed) * uIntensity;
        }
        color = 1.0 - exp(-color * 0.55);
        float alpha = clamp(max(max(color.r, color.g), color.b), 0.0, 1.0);
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });
}

export function createTesla1Preview({
  els = {},
  getOrbBaseVisualState = null,
} = {}) {
  let inspector = null;
  let shellMaterial = null;
  let orbLight = null;
  let model = null;
  let masterLayer = null;
  let haloLayer = null;
  let shapeLayer = null;
  let fieldMesh = null;
  let fieldPlaneSize = 0;
  let createdAt = 0;

  function readBo() {
    const visualState = typeof getOrbBaseVisualState === "function" ? getOrbBaseVisualState() : null;
    return Math.max(16, Number(visualState && visualState.diameterPx) || 72);
  }

  function clearLayer(layer) {
    if (!layer) return;
    while (layer.children.length) {
      const child = layer.children[0];
      layer.remove(child);
      disposeObject(child);
    }
  }

  function destroyInspector() {
    if (inspector && typeof inspector.cleanup === "function") inspector.cleanup();
    inspector = null;
    shellMaterial = null;
    orbLight = null;
    model = null;
    masterLayer = null;
    haloLayer = null;
    shapeLayer = null;
    fieldMesh = null;
    fieldPlaneSize = 0;
  }

  function masterRoute(bo, time) {
    const minRange = readInputNumber(els.tesla1MasterBoltMinRangeBo, 4, 0, 64);
    const maxRange = readInputNumber(els.tesla1MasterBoltMaxRangeBo, 7, minRange + 0.25, 64);
    const angle = time * 0.28 + 0.75;
    const radius = bo * (minRange + (maxRange - minRange) * (0.5 + 0.5 * Math.sin(time * 0.41)));
    const start = new THREE.Vector3(Math.cos(angle) * bo * ORB_RADIUS_BO, Math.sin(angle) * bo * ORB_RADIUS_BO, 0);
    const end = new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
    const bend = readInputNumber(els.tesla1MasterBoltPathBendAllowance, 1.4, 1, 8);
    if (bend <= 1.05) return [start, end];
    const normal = new THREE.Vector3(-Math.sin(angle), Math.cos(angle), 0);
    const steer = start.clone().lerp(end, 0.55).add(normal.multiplyScalar(bo * Math.min(1.25, (bend - 1) * 0.4)));
    return [start, steer, end];
  }

  function readShapeConfig() {
    const boltMin = Math.round(readInputNumber(els.tesla1HaloBoltCountMin, 4, 0, 256));
    const boltMax = Math.round(readInputNumber(els.tesla1HaloBoltCountMax, 12, boltMin, 256));
    return Object.freeze({
      boltCount: Math.round((boltMin + boltMax) * 0.5),
      noiseScale: readInputNumber(els.tesla1LightningShapeNoiseScale, 20, 0.1, 200),
      noiseStrength: readInputNumber(els.tesla1LightningShapeNoiseStrength, 0.03, 0, 0.5),
      noiseSpeed: readInputNumber(els.tesla1LightningShapeNoiseSpeed, 3, 0, 20),
    });
  }

  function syncMasterLayer(bo, time) {
    if (!masterLayer) return;
    clearLayer(masterLayer);
    masterLayer.visible = !els.tesla1MasterBoltVisibleBtn || els.tesla1MasterBoltVisibleBtn.getAttribute("aria-pressed") !== "false";
    const route = masterRoute(bo, time);
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(route),
      new THREE.LineBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.72, depthTest: false, depthWrite: false, toneMapped: false })
    );
    line.name = "tesla1:master_bolt_route";
    line.renderOrder = 218;
    masterLayer.add(line);
    const pointGeometry = new THREE.SphereGeometry(bo * 0.025, 12, 8);
    const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, depthTest: false, depthWrite: false, toneMapped: false });
    route.forEach((point, index) => {
      const marker = new THREE.Mesh(pointGeometry, pointMaterial);
      marker.name = `tesla1:master_control_point_${index}`;
      marker.position.copy(point);
      marker.renderOrder = 219;
      masterLayer.add(marker);
    });
  }

  function syncHaloLayer(bo) {
    if (!haloLayer) return;
    clearLayer(haloLayer);
    haloLayer.visible = !els.tesla1HaloVisibleBtn || els.tesla1HaloVisibleBtn.getAttribute("aria-pressed") !== "false";
    if (!readInputBoolean(els.tesla1HaloFieldEnabled, true)) return;
    const radius = readInputNumber(els.tesla1HaloFieldShellRadiusBo, 1.5, 0.5, 32) * bo;
    const zMin = readInputNumber(els.tesla1HaloFieldZMinBo, -0.3, -32, 32);
    const zMax = readInputNumber(els.tesla1HaloFieldZMaxBo, 0.3, zMin, 32);
    const zScale = Math.max(0.02, Math.max(Math.abs(zMin), Math.abs(zMax)) / Math.max(0.001, readInputNumber(els.tesla1HaloFieldShellRadiusBo, 1.5, 0.5, 32)));
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 32, 16),
      new THREE.MeshBasicMaterial({
        color: 0x376fff,
        transparent: true,
        opacity: 0.12,
        wireframe: true,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      })
    );
    shell.name = "tesla1:halo_envelope";
    shell.scale.z = zScale;
    shell.renderOrder = 210;
    haloLayer.add(shell);
  }

  function syncShapeLayer(bo, time) {
    if (!shapeLayer) return;
    shapeLayer.visible = !els.tesla1LightningShapeVisibleBtn || els.tesla1LightningShapeVisibleBtn.getAttribute("aria-pressed") !== "false";
    const shape = readShapeConfig();
    const startMin = readInputNumber(els.tesla1HaloFieldBoltStartMinBo, 0.5, 0, 32);
    const startMax = readInputNumber(els.tesla1HaloFieldBoltStartMaxBo, 0.65, startMin, 32);
    const endMin = readInputNumber(els.tesla1HaloFieldBoltEndMinBo, 1.1, 0.05, 32);
    const endMax = readInputNumber(els.tesla1HaloFieldBoltEndMaxBo, 1.6, endMin, 32);
    if (!readInputBoolean(els.tesla1BoltShaderEnabled, true)) {
      clearLayer(shapeLayer);
      fieldMesh = null;
      fieldPlaneSize = 0;
      return;
    }
    const boltColor = rgbColor(els.tesla1BoltShaderColorR && els.tesla1BoltShaderColorR.value, els.tesla1BoltShaderColorG && els.tesla1BoltShaderColorG.value, els.tesla1BoltShaderColorB && els.tesla1BoltShaderColorB.value);
    const maxRangeBo = Math.max(endMax, readInputNumber(els.tesla1HaloFieldShellRadiusBo, 1.5, 0.5, 32));
    const planeSize = bo * Math.max(2.5, maxRangeBo * 2.45);
    const materialParams = {
      boltCount: shape.boltCount,
      startMin: bo * startMin,
      startMax: bo * startMax,
      endMin: bo * endMin,
      endMax: bo * endMax,
      bo,
      boltColor,
      lineWidth: bo * readInputNumber(els.tesla1BoltShaderLineWidthBo, 0.012, 0.001, 0.25),
      intensity: readInputNumber(els.tesla1BoltShaderIntensity, 6, 0, 20),
      tipFade: readInputNumber(els.tesla1BoltShaderTipFade, 0.08, 0, 1),
      flickerHz: readInputNumber(els.tesla1BoltShaderFlickerSpeedHz, 4, 0, 60),
      flickerDepth: readInputNumber(els.tesla1BoltShaderFlickerDepth, 0.5, 0, 1),
      noiseScale: shape.noiseScale,
      noiseStrength: shape.noiseStrength,
      noiseSpeed: shape.noiseSpeed,
      time,
    };
    if (!fieldMesh || !fieldMesh.parent) {
      clearLayer(shapeLayer);
      const material = createLightningFieldMaterial(materialParams);
      fieldMesh = new THREE.Mesh(new THREE.PlaneGeometry(planeSize, planeSize, 1, 1), material);
      fieldMesh.name = "tesla1:sdf_lightning_field";
      fieldMesh.renderOrder = 214;
      fieldPlaneSize = planeSize;
      shapeLayer.add(fieldMesh);
      return;
    }
    updateLightningFieldMaterial(fieldMesh.material, materialParams);
    if (Math.abs(fieldPlaneSize - planeSize) > 0.5) {
      if (fieldMesh.geometry && typeof fieldMesh.geometry.dispose === "function") fieldMesh.geometry.dispose();
      fieldMesh.geometry = new THREE.PlaneGeometry(planeSize, planeSize, 1, 1);
      fieldPlaneSize = planeSize;
    }
  }

  function apply() {
    if (!els.previewRoot) return null;
    destroyInspector();
    const bo = readBo();
    const activeConfig = ORB_3D_VISUAL_DEFAULTS;
    createdAt = performance.now();
    inspector = createWorldObjectInspector({
      root: els.previewRoot,
      bo,
      canvasClassName: "tesla1Canvas",
      cameraPositionBo: Object.freeze({ x: 0.92, y: 0.16, z: 3.25 }),
      minDistanceBo: 0.85,
      maxDistanceBo: 28,
      enableShadows: true,
      bloom: ORB_BLOOM_CONFIG.enabled ? ORB_BLOOM_CONFIG : null,
      onFrame: () => {
        const time = (performance.now() - createdAt) / 1000;
        if (shellMaterial && shellMaterial.uniforms && shellMaterial.uniforms.uTime) shellMaterial.uniforms.uTime.value = time;
        if (orbLight) updateOrbPointLight(orbLight, time, activeConfig);
        syncHaloLayer(bo);
        syncShapeLayer(bo, time);
      },
    });
    if (!inspector) return activeConfig;
    frameCameraToSsotOrbSize(inspector, els.previewRoot, bo);
    shellMaterial = createOpalescentOrbShellMaterial(activeConfig);
    const created = createOrbModel({
      bo,
      shellMaterial,
      edgeMaterials: inspector.edgeMaterials,
      includeCore: false,
      includeRibs: false,
      edgeColor: 0xffffff,
      edgeWidth: 2,
      shellSegments: 96,
      ringSegments: 192,
    });
    model = created.model;
    if (els.tesla1OrbVisibleBtn) model.visible = els.tesla1OrbVisibleBtn.getAttribute("aria-pressed") !== "false";
    orbLight = createOrbPointLight({ bo, config: activeConfig });
    updateOrbPointLight(orbLight, 0, activeConfig);
    model.add(orbLight);
    masterLayer = new THREE.Group();
    masterLayer.name = "tesla1:master_bolt_control_layer";
    haloLayer = new THREE.Group();
    haloLayer.name = "tesla1:halo_envelope_layer";
    shapeLayer = new THREE.Group();
    shapeLayer.name = "tesla1:lightning_shape_layer";
    inspector.scene.add(new THREE.AmbientLight(0xffffff, 0.035));
    inspector.scene.add(model);
    inspector.scene.add(haloLayer);
    inspector.scene.add(shapeLayer);
    inspector.scene.add(masterLayer);
    syncMasterLayer(bo, 0);
    syncHaloLayer(bo);
    syncShapeLayer(bo, 0);
    inspector.render();
    return activeConfig;
  }

  function clear() {
    destroyInspector();
  }

  function toggleLayer(button, layer) {
    if (!button) return;
    const visible = button.getAttribute("aria-pressed") !== "false";
    button.setAttribute("aria-pressed", visible ? "false" : "true");
    if (layer) layer.visible = !visible;
    if (inspector && typeof inspector.render === "function") inspector.render();
  }

  function wire() {
    apply();
    const refreshOnCommit = (event) => {
      if (event && event.type === "keydown" && event.key !== "Enter") return;
      apply();
    };
    if (els.previewTesla1) els.previewTesla1.addEventListener("click", apply);
    if (els.tesla1OrbVisibleBtn) els.tesla1OrbVisibleBtn.addEventListener("click", () => toggleLayer(els.tesla1OrbVisibleBtn, model));
    if (els.tesla1MasterBoltVisibleBtn) els.tesla1MasterBoltVisibleBtn.addEventListener("click", () => toggleLayer(els.tesla1MasterBoltVisibleBtn, masterLayer));
    if (els.tesla1HaloVisibleBtn) els.tesla1HaloVisibleBtn.addEventListener("click", () => toggleLayer(els.tesla1HaloVisibleBtn, haloLayer));
    if (els.tesla1LightningShapeVisibleBtn) els.tesla1LightningShapeVisibleBtn.addEventListener("click", () => toggleLayer(els.tesla1LightningShapeVisibleBtn, shapeLayer));
    [
      els.tesla1MasterBoltMinRangeBo,
      els.tesla1MasterBoltMaxRangeBo,
      els.tesla1MasterBoltContactRadiusBo,
      els.tesla1MasterBoltPathBendAllowance,
      els.tesla1HaloFieldEnabled,
      els.tesla1HaloFieldShellRadiusBo,
      els.tesla1HaloFieldBoltStartMinBo,
      els.tesla1HaloFieldBoltStartMaxBo,
      els.tesla1HaloFieldBoltEndMinBo,
      els.tesla1HaloFieldBoltEndMaxBo,
      els.tesla1HaloTargetMinRangeBo,
      els.tesla1HaloTargetMaxRangeBo,
      els.tesla1HaloContactRadiusBo,
      els.tesla1HaloFieldZMinBo,
      els.tesla1HaloFieldZMaxBo,
      els.tesla1HaloBoltCountMin,
      els.tesla1HaloBoltCountMax,
      els.tesla1LightningShapeNoiseScale,
      els.tesla1LightningShapeNoiseStrength,
      els.tesla1LightningShapeNoiseSpeed,
      els.tesla1BoltShaderEnabled,
      els.tesla1BoltShaderLineWidthBo,
      els.tesla1BoltShaderIntensity,
      els.tesla1BoltShaderTipFade,
      els.tesla1BoltShaderFlickerSpeedHz,
      els.tesla1BoltShaderFlickerDepth,
      els.tesla1BoltShaderColorR,
      els.tesla1BoltShaderColorG,
      els.tesla1BoltShaderColorB,
    ].forEach((field) => {
      if (!field) return;
      field.addEventListener("keydown", refreshOnCommit);
      field.addEventListener("change", refreshOnCommit);
      field.addEventListener("blur", refreshOnCommit);
    });
  }

  return Object.freeze({
    apply,
    clear,
    play: apply,
    wire,
  });
}
