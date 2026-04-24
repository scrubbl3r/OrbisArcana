import { createStageRuntimeAdapterCore } from "../stage-runtime-adapter-core.js";

export function createOrbStageRuntimeAdapter({ refs = {}, level = null } = {}) {
  const stageRefs = Object.freeze({
    root: refs.root || null,
    physStage: refs.physStage || null,
    terrain: refs.terrain || null,
    orbWrap: refs.orbWrap || null,
    orb: refs.orb || null,
    orbInterior: refs.orbInterior || null,
    orbCracks: refs.orbCracks || null,
    orbShards: refs.orbShards || null,
    testGlobe: refs.testGlobe || null,
    shield: refs.shield || null,
    shockLayer: refs.shockLayer || null,
    flameLayer: refs.flameLayer || null,
    electricLayer: refs.electricLayer || null,
    deathPanel: refs.deathPanel || null,
    tryAgainBtn: refs.tryAgainBtn || null,
  });

  const core = createStageRuntimeAdapterCore({
    refs: stageRefs,
    level,
    getOrbWrapPosition: ({ top = 0, left = "50%" } = {}) => ({
      left: (typeof left === "number")
        ? `${Number(left || 0).toFixed(2)}px`
        : String(left || "50%"),
      transform: `translate(-50%, ${Number(top || 0).toFixed(2)}px)`,
    }),
  });

  return Object.freeze({
    ...core,
    getOrbVisualRefs() {
      return Object.freeze({
        orbWrap: stageRefs.orbWrap,
        orb: stageRefs.orb,
        orbInterior: stageRefs.orbInterior,
        orbCracks: stageRefs.orbCracks,
        orbShards: stageRefs.orbShards,
        shield: stageRefs.shield,
        shockLayer: stageRefs.shockLayer,
        flameLayer: stageRefs.flameLayer,
        electricLayer: stageRefs.electricLayer,
        deathPanel: stageRefs.deathPanel,
      });
    },
    ensureBackdrop({
      runtime = null,
      rootDocument = null,
      rect = null,
      lineArtShapes = [],
    } = {}) {
      const terrainEl = stageRefs.terrain;
      if (!runtime || !terrainEl || !rootDocument || !rect) return;

      const width = Math.max(1, Math.floor(Number(rect.width) || 0));
      const height = Math.max(1, Math.floor(Number(rect.height) || 0));
      const dpr = Math.max(1, Math.min(2.5, (rootDocument.defaultView && rootDocument.defaultView.devicePixelRatio) || 1));
      const stageBackdrop = runtime.stageBackdrop || (runtime.stageBackdrop = Object.create(null));
      const nextLineArtShapes = Array.isArray(lineArtShapes) ? lineArtShapes.slice() : [];
      const nextLineArtKey = nextLineArtShapes.map((shape = {}) => String(shape.id || "")).join("|");

      if (stageBackdrop.lineArtKey !== nextLineArtKey) {
        stageBackdrop.lineArtShapes = nextLineArtShapes;
        stageBackdrop.lineArtKey = nextLineArtKey;
        stageBackdrop.lastBackdropKey = "";
      }

      if (stageBackdrop.width === width && stageBackdrop.height === height && stageBackdrop.terrainCtx) {
        return;
      }

      stageBackdrop.width = width;
      stageBackdrop.height = height;
      terrainEl.width = Math.floor(width * dpr);
      terrainEl.height = Math.floor(height * dpr);
      terrainEl.style.width = `${width}px`;
      terrainEl.style.height = `${height}px`;

      stageBackdrop.terrainCtx = terrainEl.getContext("2d", { alpha: true });
      if (stageBackdrop.terrainCtx) stageBackdrop.terrainCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },
    drawBackdrop({
      runtime = null,
    } = {}) {
      const stageBackdrop = runtime && runtime.stageBackdrop;
      if (!stageBackdrop || !stageBackdrop.terrainCtx) return;
      const ctx = stageBackdrop.terrainCtx;
      const w = stageBackdrop.width || 0;
      const h = stageBackdrop.height || 0;
      const frame = runtime && runtime.frameMetrics ? runtime.frameMetrics : null;
      const camLeft = Number(frame && frame.camLeft) || 0;
      const camTop = Number(frame && frame.camTop) || 0;
      const zoom = Number(frame && frame.zoom) || 1;
      const lineArtShapes = Array.isArray(stageBackdrop.lineArtShapes) ? stageBackdrop.lineArtShapes : [];
      const nextBackdropKey = `${camLeft.toFixed(2)}|${camTop.toFixed(2)}|${zoom.toFixed(4)}|${stageBackdrop.lineArtKey || ""}`;
      if (nextBackdropKey === stageBackdrop.lastBackdropKey) {
        return;
      }
      stageBackdrop.lastBackdropKey = nextBackdropKey;

      ctx.clearRect(0, 0, w, h);
      if (lineArtShapes.length) {
        for (const shape of lineArtShapes) {
          const worldPoints = Array.isArray(shape && shape.worldPoints) ? shape.worldPoints : [];
          if (worldPoints.length < 2) continue;
          ctx.beginPath();
          for (let i = 0; i < worldPoints.length; i += 1) {
            const point = worldPoints[i] || {};
            const x = (Number(point.xW) - camLeft) * zoom;
            const y = (Number(point.yW) - camTop) * zoom;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          const fill = String(shape && shape.fill || "none").trim().toLowerCase();
          const fillOpacity = Number(shape && shape.fillOpacity);
          if (fill && fill !== "none" && fillOpacity > 0) {
            ctx.globalAlpha = Math.max(0, Math.min(1, fillOpacity));
            ctx.fillStyle = String(shape.fill);
            ctx.fill();
          }
          const stroke = String(shape && shape.stroke || "none").trim().toLowerCase();
          const strokeOpacity = Number(shape && shape.strokeOpacity);
          if (stroke && stroke !== "none" && strokeOpacity > 0) {
            ctx.globalAlpha = Math.max(0, Math.min(1, strokeOpacity));
            ctx.strokeStyle = String(shape.stroke);
            ctx.lineWidth = Math.max(1, (Number(shape && shape.worldStrokeWidth) || 1) * zoom);
            ctx.lineJoin = "miter";
            ctx.lineCap = "round";
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }
      }
    },
  });
}
