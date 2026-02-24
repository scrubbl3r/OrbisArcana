import {
  PORCUPINE_LOCAL_ASSET_MANIFEST,
  getPorcupineInitStatus,
  initLocalPorcupineKwsBackend,
} from "./porcupine-init.js";

let bootState = {
  attempted: false,
  loadedScript: false,
  installed: false,
  reason: "not_attempted",
};

function isPlaceholderManifest(manifest = PORCUPINE_LOCAL_ASSET_MANIFEST) {
  const sdk = manifest && manifest.sdk ? manifest.sdk : {};
  return String(sdk.version || "").toUpperCase() === "UNSET"
    || String(sdk.scriptPath || "").includes("/UNSET/");
}

function ensureScriptOnce(src) {
  if (typeof document === "undefined" || !src) return Promise.resolve(false);
  const existing = document.querySelector(`script[data-orbis-kws-sdk="true"][src="${src}"]`);
  if (existing) {
    if (existing.dataset.loaded === "true") return Promise.resolve(true);
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Failed to load KWS SDK script: ${src}`)), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.dataset.orbisKwsSdk = "true";
    s.addEventListener("load", () => {
      s.dataset.loaded = "true";
      resolve(true);
    }, { once: true });
    s.addEventListener("error", () => reject(new Error(`Failed to load KWS SDK script: ${src}`)), { once: true });
    document.head.appendChild(s);
  });
}

function resolveCreateSdkSession(factoryName = "OrbisCreatePorcupineSdkSession") {
  if (typeof window === "undefined") return null;
  const fn = window[factoryName];
  return (typeof fn === "function") ? fn : null;
}

/**
 * Best-effort local Porcupine boot:
 * - attempts to load local SDK script (if manifest is configured)
 * - looks for a global session factory (default `window.OrbisCreatePorcupineSdkSession`)
 * - installs `window.OrbisKwsBackendFactory` via `initLocalPorcupineKwsBackend(...)`
 *
 * Safe fallback behavior:
 * - returns `installed:false` when local SDK assets are not present/configured
 * - does not break receiver/STT startup
 */
export async function bootLocalPorcupineKws(opts = {}) {
  if (bootState.installed) {
    return {
      installed: true,
      status: { ...bootState, init: getPorcupineInitStatus() },
    };
  }

  bootState = {
    attempted: true,
    loadedScript: false,
    installed: false,
    reason: "starting",
  };

  const manifest = opts.manifest || PORCUPINE_LOCAL_ASSET_MANIFEST;
  const factoryName = String(opts.globalFactoryName || "OrbisCreatePorcupineSdkSession");

  try {
    if (isPlaceholderManifest(manifest)) {
      bootState.reason = "manifest_unset";
      return {
        installed: false,
        status: { ...bootState, init: getPorcupineInitStatus() },
      };
    }

    const scriptPath = manifest && manifest.sdk ? manifest.sdk.scriptPath : "";
    if (scriptPath) {
      await ensureScriptOnce(scriptPath);
      bootState.loadedScript = true;
    }

    const createSdkSession = resolveCreateSdkSession(factoryName);
    if (!createSdkSession) {
      bootState.reason = "sdk_factory_missing";
      return {
        installed: false,
        status: { ...bootState, init: getPorcupineInitStatus() },
      };
    }

    const keywordEntries = Object.entries((manifest && manifest.keywords) || {}).map(([token, modelPath]) => ({
      token,
      label: token,
      modelPath,
    }));

    const res = await initLocalPorcupineKwsBackend({
      label: "porcupine-web-local",
      createSdkSession,
      keywords: keywordEntries,
    });

    bootState.installed = !!(res && res.installed);
    bootState.reason = bootState.installed ? "installed" : "init_failed";
    return {
      installed: bootState.installed,
      status: { ...bootState, init: (res && res.status) ? res.status : getPorcupineInitStatus() },
      error: res && res.error ? res.error : null,
    };
  } catch (err) {
    bootState.reason = err && err.message ? String(err.message) : "boot_failed";
    return {
      installed: false,
      status: { ...bootState, init: getPorcupineInitStatus() },
      error: err,
    };
  }
}

export function getLocalPorcupineBootStatus() {
  return { ...bootState, init: getPorcupineInitStatus() };
}

