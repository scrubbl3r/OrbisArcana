export async function publishLabProfile({
  built,
  contract,
  buildLiveModule,
  buildSecondaryModule,
  ensureProjectConnected,
  hasProjectConnection,
  saveConnectedPath,
  saveConnectedDraft,
  saveProjectFile,
  downloadTextFile,
  draftPathParts,
  describeLivePublishSuccess,
  draftLabel = "draft",
  fileWriteMessage = "Profile written.",
} = {}) {
  if (!built || !built.payload) return { ok: false, aborted: true };
  const payloadText = JSON.stringify(built.payload, null, 2);
  let projectConnected = !!hasProjectConnection;

  try {
    if (!projectConnected && typeof ensureProjectConnected === "function") {
      const connected = await ensureProjectConnected();
      if (!connected) return { ok: false, aborted: true };
      projectConnected = true;
    }

    if (projectConnected) {
      const liveTarget = contract && contract.livePreset ? contract.livePreset : null;
      const secondaryTarget = contract && contract.behavior ? contract.behavior : null;
      const canPublishSecondary = !!secondaryTarget && typeof buildSecondaryModule === "function";
      if (liveTarget && typeof buildLiveModule === "function") {
        const moduleText = buildLiveModule(built.payload.params);
        if (moduleText) {
          const publishedPaths = [];
          let ok = await saveConnectedPath(liveTarget.path, moduleText);
          if (ok) publishedPaths.push(liveTarget.path);
          if (ok && canPublishSecondary) {
            const secondaryModuleText = buildSecondaryModule(built.payload.params);
            ok = await saveConnectedPath(secondaryTarget.path, secondaryModuleText);
            if (ok) publishedPaths.push(secondaryTarget.path);
          }
          if (ok) {
            return {
              ok: true,
              kind: "live",
              message: typeof describeLivePublishSuccess === "function"
                ? describeLivePublishSuccess({ publishedPaths, contract })
                : "Published.",
            };
          }
        }
      }

      const ok = await saveConnectedDraft(built.filename, payloadText);
      if (ok) {
        return {
          ok: true,
          kind: "draft",
          message: `Published ${draftLabel} to ${Array.isArray(draftPathParts) ? draftPathParts.join("/") : ""}/${built.filename}`,
        };
      }
    }

    const ok = await saveProjectFile(built.filename, payloadText);
    if (ok) return { ok: true, kind: "file", message: fileWriteMessage };

    downloadTextFile(built.filename, payloadText);
    return { ok: true, kind: "download", message: null };
  } catch (err) {
    if (err && err.name === "AbortError") return { ok: false, aborted: true };
    downloadTextFile(built.filename, JSON.stringify(built.payload, null, 2));
    return { ok: false, downloadedFallback: true, error: err };
  }
}

export async function writeConnectedProjectModule({
  moduleText,
  targetPath,
  hasProjectConnection,
  saveConnectedPath,
  successLabel = "module",
  missingConnectionMessage,
  failureMessage,
} = {}) {
  if (!hasProjectConnection) {
    return { ok: false, needsConnection: true, message: missingConnectionMessage || "Connect Project first." };
  }
  try {
    const ok = await saveConnectedPath(targetPath, moduleText);
    if (ok) {
      return { ok: true, message: `Published ${successLabel} to ${Array.isArray(targetPath) ? targetPath.join("/") : String(targetPath || "")}` };
    }
    throw new Error("Project module write failed");
  } catch (err) {
    if (err && err.name === "AbortError") return { ok: false, aborted: true };
    return {
      ok: false,
      error: err,
      message: failureMessage || "Module publish failed. No fallback export was created. Reconnect the project and try again.",
    };
  }
}
