import * as THREE from "three";

const OFFSCREEN_POSITION = new THREE.Vector3(0, 0, -100000);
const ZERO_SCALE = new THREE.Vector3(0, 0, 0);

function finiteNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeSeed(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return Math.abs(Math.sin(fallback * 12.9898) * 43758.5453) % 1;
  return Math.abs(Math.sin(n * 12.9898) * 43758.5453) % 1;
}

function createRibbonGeometry({
  widthSegments = 4,
  heightSegments = 50,
} = {}) {
  const cols = Math.max(1, Math.round(widthSegments));
  const rows = Math.max(1, Math.round(heightSegments));
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let y = 0; y <= rows; y += 1) {
    const v = y / rows;
    for (let x = 0; x <= cols; x += 1) {
      const u = x / cols;
      positions.push(u - 0.5, v, 0);
      uvs.push(u, v);
    }
  }
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const a = y * (cols + 1) + x;
      const b = a + cols + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  geometry.userData.surfaceFireRibbon = Object.freeze({ widthSegments: cols, heightSegments: rows });
  return geometry;
}

function createSurfaceFireRibbonMaterial({
  edgeFeatherPx = 3,
  endCapFeatherPx = 6,
  bottomFeatherPx = 4,
  wakeNoiseScale = 1.45,
  wakeNoiseSpeed = 7,
  wakeNoiseDensityBottom = 0.7,
  wakeNoiseDensityTop = 0.08,
  wakeNoiseContrast = 0.22,
  wakeNoiseOctaves = 5,
  wakeNoiseLacunarity = 1.1,
  wakeNoiseGain = 0.32,
  wakeSimplexScale = 0.9,
  wakeSimplexSpeed = 8,
  wakeSimplexDensityBottom = 0.1,
  wakeSimplexDensityTop = 0.42,
  wakeSimplexContrast = 0.34,
  wakeSimplexOctaves = 4,
  wakeSimplexLacunarity = 1.1,
  wakeSimplexGain = 0.36,
  wakeNoiseMix = 0.48,
  wakeCarveStrength = 0.56,
} = {}) {
  return new THREE.ShaderMaterial({
    name: "surface_fire:ribbon_bent_flame_material",
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide,
    toneMapped: false,
    extensions: { derivatives: true },
    uniforms: {
      uTime: { value: 0 },
      uEdgeFeatherPx: { value: Math.max(0, finiteNumber(edgeFeatherPx, 3)) },
      uEndCapFeatherPx: { value: Math.max(0, finiteNumber(endCapFeatherPx, 6)) },
      uBottomFeatherPx: { value: Math.max(0, finiteNumber(bottomFeatherPx, 4)) },
      uWakeNoiseScale: { value: Math.max(0.1, finiteNumber(wakeNoiseScale, 1.45)) },
      uWakeNoiseSpeed: { value: Math.max(0, finiteNumber(wakeNoiseSpeed, 7)) },
      uWakeNoiseDensityBottom: { value: Math.max(0, Math.min(1, finiteNumber(wakeNoiseDensityBottom, 0.7))) },
      uWakeNoiseDensityTop: { value: Math.max(0, Math.min(1, finiteNumber(wakeNoiseDensityTop, 0.08))) },
      uWakeNoiseContrast: { value: Math.max(0.02, Math.min(0.6, finiteNumber(wakeNoiseContrast, 0.22))) },
      uWakeNoiseOctaves: { value: Math.max(1, Math.min(8, Math.round(finiteNumber(wakeNoiseOctaves, 5)))) },
      uWakeNoiseLacunarity: { value: Math.max(1.1, finiteNumber(wakeNoiseLacunarity, 1.1)) },
      uWakeNoiseGain: { value: Math.max(0.1, Math.min(0.9, finiteNumber(wakeNoiseGain, 0.32))) },
      uWakeSimplexScale: { value: Math.max(0.1, finiteNumber(wakeSimplexScale, 0.9)) },
      uWakeSimplexSpeed: { value: Math.max(0, finiteNumber(wakeSimplexSpeed, 8)) },
      uWakeSimplexDensityBottom: { value: Math.max(0, Math.min(1, finiteNumber(wakeSimplexDensityBottom, 0.1))) },
      uWakeSimplexDensityTop: { value: Math.max(0, Math.min(1, finiteNumber(wakeSimplexDensityTop, 0.42))) },
      uWakeSimplexContrast: { value: Math.max(0.02, Math.min(0.6, finiteNumber(wakeSimplexContrast, 0.34))) },
      uWakeSimplexOctaves: { value: Math.max(1, Math.min(8, Math.round(finiteNumber(wakeSimplexOctaves, 4)))) },
      uWakeSimplexLacunarity: { value: Math.max(1.1, finiteNumber(wakeSimplexLacunarity, 1.1)) },
      uWakeSimplexGain: { value: Math.max(0.1, Math.min(0.9, finiteNumber(wakeSimplexGain, 0.36))) },
      uWakeNoiseMix: { value: Math.max(0, Math.min(1, finiteNumber(wakeNoiseMix, 0.48))) },
      uWakeCarveStrength: { value: Math.max(0, Math.min(1, finiteNumber(wakeCarveStrength, 0.56))) },
    },
    vertexShader: `
      precision highp float;
      attribute float aFireSeed;
      attribute float aBendStrength;
      attribute vec2 aUpLocal;
      varying vec2 vUv;
      varying float vFireSeed;
      varying vec3 vBentLocalPos;

      void main() {
        vec3 local = position;
        float rise01 = clamp(local.y, 0.0, 1.0);
        vec2 upLocal = normalize(aUpLocal + vec2(0.0, 0.0001));
        vec2 normalLocal = vec2(0.0, 1.0);
        float bendCurve = pow(rise01, 1.35) * clamp(aBendStrength, 0.0, 0.86);
        local.xy += (upLocal - normalLocal) * rise01 * bendCurve;
        vUv = uv;
        vFireSeed = aFireSeed;
        vBentLocalPos = local;
        vec4 worldPosition = vec4(local, 1.0);
        #ifdef USE_INSTANCING
          worldPosition = instanceMatrix * worldPosition;
        #endif
        gl_Position = projectionMatrix * modelViewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform float uTime;
      uniform float uEdgeFeatherPx;
      uniform float uEndCapFeatherPx;
      uniform float uBottomFeatherPx;
      uniform float uWakeNoiseScale; uniform float uWakeNoiseSpeed; uniform float uWakeNoiseDensityBottom; uniform float uWakeNoiseDensityTop; uniform float uWakeNoiseContrast; uniform float uWakeNoiseOctaves; uniform float uWakeNoiseLacunarity; uniform float uWakeNoiseGain;
      uniform float uWakeSimplexScale; uniform float uWakeSimplexSpeed; uniform float uWakeSimplexDensityBottom; uniform float uWakeSimplexDensityTop; uniform float uWakeSimplexContrast; uniform float uWakeSimplexOctaves; uniform float uWakeSimplexLacunarity; uniform float uWakeSimplexGain; uniform float uWakeNoiseMix;
      uniform float uWakeCarveStrength;
      varying vec2 vUv;
      varying float vFireSeed;
      varying vec3 vBentLocalPos;

      float hash31(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
      float noise(vec3 p) {
        vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hash31(i), hash31(i + vec3(1.0, 0.0, 0.0)), f.x), mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x), f.y), mix(mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x), mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);
      }
      float fbm(vec3 p, float octaves, float lacunarity, float gain) {
        float value = 0.0; float amp = 0.56; float freq = 1.0;
        for (int i = 0; i < 8; i += 1) { if (float(i) >= octaves) break; value += noise(p * freq) * amp; freq *= lacunarity; amp *= gain; p += vec3(17.7, -11.3, 8.9); }
        return clamp(value, 0.0, 1.0);
      }
      float ridgedFbm(vec3 p) {
        float value = 0.0; float amp = 0.58; float freq = 1.0;
        for (int i = 0; i < 8; i += 1) { if (float(i) >= uWakeNoiseOctaves) break; float ridge = 1.0 - abs(noise(p * freq) * 2.0 - 1.0); ridge *= ridge; value += ridge * amp; freq *= uWakeNoiseLacunarity * 1.04; amp *= uWakeNoiseGain * 0.92; p += vec3(-6.4, 19.1, 12.8); }
        return clamp(value, 0.0, 1.0);
      }
      float perlinMusgraveField(vec3 p) {
        float base = fbm(p, uWakeNoiseOctaves, uWakeNoiseLacunarity, uWakeNoiseGain);
        float ridge = ridgedFbm(p * 0.82 + vec3(3.4, -7.8, 2.1));
        float broad = fbm(p * 0.46 + vec3(-11.2, 4.6, 9.3), uWakeNoiseOctaves, uWakeNoiseLacunarity, uWakeNoiseGain);
        return clamp(base * 0.46 + ridge * 0.34 + broad * 0.32, 0.0, 1.0);
      }
      vec3 simplexGrad(vec3 p) {
        float z = hash31(p) * 2.0 - 1.0;
        float a = hash31(p + vec3(19.19, 7.31, 2.47)) * 6.28318530718;
        float r = sqrt(max(0.0, 1.0 - z * z));
        return vec3(r * cos(a), r * sin(a), z);
      }
      float simplexNoise(vec3 v) {
        const float F3 = 0.33333333333;
        const float G3 = 0.16666666667;
        vec3 i = floor(v + dot(v, vec3(F3)));
        vec3 x0 = v - i + dot(i, vec3(G3));
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + G3;
        vec3 x2 = x0 - i2 + 2.0 * G3;
        vec3 x3 = x0 - 1.0 + 3.0 * G3;
        float n = 0.0;
        float t0 = 0.6 - dot(x0, x0);
        if (t0 > 0.0) { t0 *= t0; n += t0 * t0 * dot(simplexGrad(i), x0); }
        float t1 = 0.6 - dot(x1, x1);
        if (t1 > 0.0) { t1 *= t1; n += t1 * t1 * dot(simplexGrad(i + i1), x1); }
        float t2 = 0.6 - dot(x2, x2);
        if (t2 > 0.0) { t2 *= t2; n += t2 * t2 * dot(simplexGrad(i + i2), x2); }
        float t3 = 0.6 - dot(x3, x3);
        if (t3 > 0.0) { t3 *= t3; n += t3 * t3 * dot(simplexGrad(i + vec3(1.0)), x3); }
        return clamp(n * 32.0 * 0.5 + 0.5, 0.0, 1.0);
      }
      float simplexFbm(vec3 p) {
        float value = 0.0; float amp = 0.56; float freq = 1.0;
        for (int i = 0; i < 8; i += 1) { if (float(i) >= uWakeSimplexOctaves) break; value += simplexNoise(p * freq) * amp; freq *= uWakeSimplexLacunarity; amp *= uWakeSimplexGain; p += vec3(-13.1, 9.7, 21.4); }
        return clamp(value, 0.0, 1.0);
      }
      float simplexGranularField(vec3 p) {
        float fine = simplexFbm(p);
        float ridged = 1.0 - abs(simplexFbm(p * 1.34 + vec3(4.1, -8.7, 6.3)) * 2.0 - 1.0);
        return clamp(fine * 0.62 + ridged * ridged * 0.38, 0.0, 1.0);
      }
      float colorRampMask(float field, float density, float contrast) {
        float edge = clamp(contrast, 0.02, 0.6);
        float center = mix(0.72, 0.30, clamp(density, 0.0, 1.0));
        return smoothstep(center - edge * 0.5, center + edge * 0.5, field);
      }
      vec4 sampleWakeGraph(float value) {
        float t = clamp(value, 0.0, 1.0);
        vec4 a = vec4(0.0, 0.0, 0.0, 0.0);
        vec4 b = vec4(1.0, 0.0, 0.0, 1.0);
        vec4 c = vec4(1.0, 0.706, 0.0, 1.0);
        vec4 d = vec4(1.0, 0.941, 0.784, 1.0);
        if (t < 0.3) return mix(a, b, smoothstep(0.0, 0.3, t));
        if (t < 0.5) return mix(b, c, smoothstep(0.3, 0.5, t));
        return mix(c, d, smoothstep(0.5, 1.0, t));
      }
      float sampleWakeAlphaGradient(float t) {
        t = clamp(t, 0.0, 1.0);
        if (t < 0.6) return mix(1.0, 0.78, smoothstep(0.0, 0.6, t));
        if (t < 0.85) return mix(0.78, 0.28, smoothstep(0.6, 0.85, t));
        return mix(0.28, 0.0, smoothstep(0.85, 1.0, t));
      }

      void main() {
        vec2 localPx = vec2(
          length(vec2(dFdx(vBentLocalPos.x), dFdy(vBentLocalPos.x))),
          length(vec2(dFdx(vBentLocalPos.y), dFdy(vBentLocalPos.y)))
        );
        float px = max(localPx.x, localPx.y);
        float sideDistance = min(vUv.x, 1.0 - vUv.x);
        float topDistance = 1.0 - vUv.y;
        float sideFeather = max(0.00001, uEndCapFeatherPx * px);
        float edgeFeather = max(0.00001, uEdgeFeatherPx * px);
        float bottomFeather = max(0.00001, uBottomFeatherPx * px);
        float alpha = smoothstep(0.0, sideFeather, sideDistance);
        alpha *= smoothstep(0.0, edgeFeather, topDistance);
        alpha *= smoothstep(0.0, bottomFeather, vUv.y);

        float seed = fract(vFireSeed);
        vec3 seedOffset = vec3(seed * 37.17 + 3.1, seed * -53.29 + 8.7, seed * 19.83 - 4.4);
        vec2 cardUv = vec2((vUv.x - 0.5) * 1.15, clamp(vUv.y, 0.035, 0.965));
        float perlinTime = uTime * uWakeNoiseSpeed;
        float perlinFrequency = 0.70833335 / max(0.1, uWakeNoiseScale);
        vec3 perlinFlow = vec3(
          cardUv.x * perlinFrequency,
          (cardUv.y * 1.35 - perlinTime * 0.42) * perlinFrequency,
          0.0
        ) + seedOffset;
        float perlinDensity = mix(uWakeNoiseDensityBottom, uWakeNoiseDensityTop, cardUv.y);
        float perlin = perlinMusgraveField(perlinFlow);

        float simplexTime = uTime * uWakeSimplexSpeed;
        float simplexFrequency = 0.70833335 / max(0.1, uWakeSimplexScale);
        vec3 simplexFlow = vec3(
          cardUv.x * simplexFrequency,
          (cardUv.y * 1.52 - simplexTime * 0.5) * simplexFrequency,
          0.0
        ) + seedOffset * 1.37;
        float simplexDensity = mix(uWakeSimplexDensityBottom, uWakeSimplexDensityTop, cardUv.y);
        float simplex = simplexGranularField(simplexFlow);

        float noiseMix = clamp(uWakeNoiseMix, 0.0, 1.0);
        float field = mix(perlin, simplex, noiseMix);
        float density = mix(perlinDensity, simplexDensity, noiseMix);
        float contrast = mix(uWakeNoiseContrast, uWakeSimplexContrast, noiseMix);
        float broadBlobs = colorRampMask(perlin, perlinDensity, uWakeNoiseContrast);
        float detailBlobs = colorRampMask(simplex, simplexDensity, uWakeSimplexContrast);
        float mixedBlobs = colorRampMask(field, density, contrast);
        float carvedBlobs = broadBlobs * mix(1.0, detailBlobs, clamp(uWakeCarveStrength, 0.0, 1.0));
        float blobs = mix(mixedBlobs, carvedBlobs, clamp(uWakeCarveStrength, 0.0, 1.0));
        vec4 mapped = sampleWakeGraph(blobs);
        float verticalAlpha = sampleWakeAlphaGradient(cardUv.y) * alpha;
        mapped.rgb *= verticalAlpha;
        mapped.a *= verticalAlpha;
        if (mapped.a <= 0.004) discard;
        gl_FragColor = mapped;
      }
    `,
  });
}

export function createSurfaceFireRibbonSystem({
  root = null,
  maxCards = 640,
  materialOptions = null,
} = {}) {
  const parent = root || new THREE.Group();
  const geometry = createRibbonGeometry({ heightSegments: 50, widthSegments: 4 });
  const material = createSurfaceFireRibbonMaterial(materialOptions || {});
  const mesh = new THREE.InstancedMesh(geometry, material, Math.max(1, Math.floor(maxCards)));
  const seedAttribute = new THREE.InstancedBufferAttribute(new Float32Array(mesh.count), 1);
  const bendAttribute = new THREE.InstancedBufferAttribute(new Float32Array(mesh.count), 1);
  const upLocalAttribute = new THREE.InstancedBufferAttribute(new Float32Array(mesh.count * 2), 2);
  seedAttribute.setUsage(THREE.DynamicDrawUsage);
  bendAttribute.setUsage(THREE.DynamicDrawUsage);
  upLocalAttribute.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("aFireSeed", seedAttribute);
  geometry.setAttribute("aBendStrength", bendAttribute);
  geometry.setAttribute("aUpLocal", upLocalAttribute);
  mesh.name = "vfx:surface-fire-ribbons";
  mesh.frustumCulled = false;
  mesh.renderOrder = 1200;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  parent.add(mesh);

  const matrix = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const position = new THREE.Vector3();
  let writeIndex = 0;
  let lastSample = null;

  function hideInstance(index = 0) {
    quat.identity();
    matrix.compose(OFFSCREEN_POSITION, quat, ZERO_SCALE);
    mesh.setMatrixAt(index, matrix);
    seedAttribute.setX(index, 0);
    bendAttribute.setX(index, 0);
    upLocalAttribute.setXY(index, 0, 1);
  }

  function beginFrame(nowSec = 0) {
    writeIndex = 0;
    lastSample = null;
    if (material.uniforms && material.uniforms.uTime) material.uniforms.uTime.value = Number(nowSec) || 0;
  }

  function addRibbon({
    x = 0,
    y = 0,
    z = 0,
    widthPx = 18,
    heightPx = 72,
    seed = null,
    quaternion = null,
    bendStrength = 0,
    upLocalX = 0,
    upLocalY = 1,
  } = {}) {
    if (writeIndex >= mesh.count) return;
    position.set(x, y, z);
    scale.set(Math.max(1, Number(widthPx) || 1), Math.max(1, Number(heightPx) || 1), 1);
    matrix.compose(position, quaternion || quat.identity(), scale);
    mesh.setMatrixAt(writeIndex, matrix);
    const resolvedSeed = normalizeSeed(seed, (x * 0.013) + (y * 0.017));
    seedAttribute.setX(writeIndex, resolvedSeed);
    bendAttribute.setX(writeIndex, Math.max(0, Math.min(0.86, Number(bendStrength) || 0)));
    upLocalAttribute.setXY(writeIndex, Number(upLocalX) || 0, Number(upLocalY) || 1);
    if (!lastSample) {
      lastSample = {
        x: Math.round(position.x * 10) / 10,
        y: Math.round(position.y * 10) / 10,
        z: Math.round(position.z * 10) / 10,
        width: Math.round(scale.x * 10) / 10,
        height: Math.round(scale.y * 10) / 10,
        bendStrength: Math.round((Number(bendStrength) || 0) * 1000) / 1000,
        upLocal: {
          x: Math.round((Number(upLocalX) || 0) * 1000) / 1000,
          y: Math.round((Number(upLocalY) || 1) * 1000) / 1000,
        },
        seed: Math.round(resolvedSeed * 1000) / 1000,
      };
    }
    writeIndex += 1;
  }

  function endFrame() {
    for (let i = writeIndex; i < mesh.count; i += 1) hideInstance(i);
    mesh.instanceMatrix.needsUpdate = true;
    seedAttribute.needsUpdate = true;
    bendAttribute.needsUpdate = true;
    upLocalAttribute.needsUpdate = true;
    mesh.visible = writeIndex > 0;
  }

  function dispose() {
    parent.remove(mesh);
    geometry.dispose();
    material.dispose();
  }

  for (let i = 0; i < mesh.count; i += 1) hideInstance(i);
  mesh.visible = false;

  return Object.freeze({
    beginFrame,
    addRibbon,
    endFrame,
    dispose,
    getTrace() {
      return Object.freeze({
        activeCount: writeIndex,
        visible: !!mesh.visible,
        mesh: {
          name: mesh.name,
          parentName: mesh.parent && mesh.parent.name ? mesh.parent.name : "",
          shape: "subdivided-bent-ribbon",
          subdivisions: geometry.userData.surfaceFireRibbon,
          renderOrder: mesh.renderOrder,
          frustumCulled: !!mesh.frustumCulled,
          materialDepthTest: !!(mesh.material && mesh.material.depthTest),
          materialDepthWrite: !!(mesh.material && mesh.material.depthWrite),
          materialName: mesh.material && mesh.material.name ? mesh.material.name : "",
        },
        sample: lastSample,
      });
    },
    get activeCount() {
      return writeIndex;
    },
  });
}
