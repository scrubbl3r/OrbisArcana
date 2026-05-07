import { createLegacyDomOrbShatterRuntimeController } from "./legacy-dom-orb-shatter-runtime-controller.js";

function lineToPath(seg) {
  if (!seg || !seg.a || !seg.b) return "";
  return `M ${Number(seg.a.x).toFixed(2)} ${Number(seg.a.y).toFixed(2)} L ${Number(seg.b.x).toFixed(2)} ${Number(seg.b.y).toFixed(2)}`;
}

export function createLegacyDomOrbStageAdapter({
  refs = {},
  getOrbWrapPosition = null,
} = {}) {
  let lastOrbLeft = "";
  let lastOrbTransform = "";
  let lastOrbShattered = null;
  let lastOrbOpacity = null;
  let lastCrackRenderKey = "";
  let lastCrackMarkup = "";

  return Object.freeze({
    applyLegacyDomOrbTransform({
      top = 0,
      left = "50%",
      xW = null,
      yW = null,
    } = {}) {
      if (!refs.orbWrap) return;
      const resolved = typeof getOrbWrapPosition === "function"
        ? getOrbWrapPosition({ top, left, xW, yW })
        : {
            left: (typeof left === "number") ? `${Number(left || 0).toFixed(2)}px` : String(left || "50%"),
            transform: `translate(-50%, ${Number(top || 0).toFixed(2)}px)`,
          };
      const nextLeft = String((resolved && resolved.left) || "50%");
      const nextTransform = String((resolved && resolved.transform) || "translate(-50%, 0px)");
      if (nextLeft !== lastOrbLeft) {
        lastOrbLeft = nextLeft;
        refs.orbWrap.style.left = nextLeft;
      }
      if (nextTransform !== lastOrbTransform) {
        lastOrbTransform = nextTransform;
        refs.orbWrap.style.transform = nextTransform;
      }
    },
    renderLegacyDomOrbDamageVisuals({
      fx = null,
    } = {}) {
      if (!refs.orb || !refs.orbCracks) return;
      const shattered = !!(fx && fx.visualState === "shattered");
      if (shattered !== lastOrbShattered) {
        lastOrbShattered = shattered;
        refs.orb.classList.toggle("shattered", shattered);
      }
      const nextOrbOpacity = shattered ? "0" : "";
      if (nextOrbOpacity !== lastOrbOpacity) {
        lastOrbOpacity = nextOrbOpacity;
        refs.orb.style.opacity = nextOrbOpacity;
      }
      const shardStyle = fx && fx.shardStyle && typeof fx.shardStyle === "object" ? fx.shardStyle : null;
      const shardRgb = shardStyle && shardStyle.strokeRgb ? shardStyle.strokeRgb : null;
      const shardStroke = shardRgb
        ? `rgb(${Math.round(Number(shardRgb.r) || 0)},${Math.round(Number(shardRgb.g) || 0)},${Math.round(Number(shardRgb.b) || 0)})`
        : "";
      const shardAlpha = shardStyle && Number.isFinite(Number(shardStyle.strokeAlpha))
        ? Math.max(0, Math.min(1, Number(shardStyle.strokeAlpha)))
        : null;
      const shardStrokeWidth = shardStyle && Number.isFinite(Number(shardStyle.strokeWidthPx))
        ? Math.max(0.25, Number(shardStyle.strokeWidthPx))
        : null;
      const crackSegments = (!shattered && Array.isArray(fx && fx.crackSegments))
        ? fx.crackSegments
        : [];
      const crackRenderKey = [
        shattered ? "1" : "0",
        String(fx && fx.visualState || ""),
        String(fx && fx.layoutSeed || ""),
        String(fx && fx.lifeId || ""),
        String(fx && fx.hitsTaken || ""),
        String(crackSegments.length || 0),
        shardStroke,
        shardAlpha != null ? shardAlpha.toFixed(3) : "",
        shardStrokeWidth != null ? shardStrokeWidth.toFixed(2) : "",
      ].join("|");
      if (crackRenderKey === lastCrackRenderKey) return;
      lastCrackRenderKey = crackRenderKey;

      const paths = [];
      if (crackSegments.length) {
        for (const seg of crackSegments) {
          const d = lineToPath(seg);
          if (!d) continue;
          const style = [
            shardStroke ? `stroke:${shardStroke}` : "",
            shardAlpha != null ? `stroke-opacity:${shardAlpha.toFixed(3)}` : "",
            shardStrokeWidth != null ? `stroke-width:${shardStrokeWidth.toFixed(2)}px` : "",
          ].filter(Boolean).join(";");
          const attrs = [`d="${d}"`, style ? `style="${style}"` : ""].filter(Boolean).join(" ");
          paths.push(`<path ${attrs} />`);
        }
      }
      const nextMarkup = paths.join("");
      if (nextMarkup !== lastCrackMarkup) {
        lastCrackMarkup = nextMarkup;
        refs.orbCracks.innerHTML = nextMarkup;
      }
    },
    createLegacyDomOrbShatterController({
      root = refs.root,
      getOrbShatterRuntime = () => null,
      getOrbColorState = () => null,
      getBaseFillAlpha = () => 0.20,
      clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0)),
      clamp01 = (n) => Math.max(0, Math.min(1, Number(n) || 0)),
    } = {}) {
      if (!refs.orb || typeof createLegacyDomOrbShatterRuntimeController !== "function") return null;
      return createLegacyDomOrbShatterRuntimeController({
        root,
        getOrbEl: () => refs.orb,
        getOrbShatterRuntime,
        getOrbColorState,
        getBaseFillAlpha,
        clamp,
        clamp01,
      });
    },
  });
}
