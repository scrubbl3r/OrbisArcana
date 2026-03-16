import { basename } from "node:path";

function assertRelPathStringV2(relPath, context) {
  if (typeof relPath !== "string") {
    throw new Error(`${context} relPath must be a string`);
  }
  if (!relPath.trim()) {
    throw new Error(`${context} relPath must be non-empty`);
  }
}

function toRelPathArrayOrThrowV2(relPaths, context) {
  if (relPaths == null) {
    throw new Error(`${context} relPaths are required`);
  }
  if (typeof relPaths[Symbol.iterator] !== "function") {
    throw new Error(`${context} relPaths must be iterable`);
  }
  return Array.from(relPaths);
}

export function docsIndexLinkTokenForRelPathV2(relPath) {
  assertRelPathStringV2(relPath, "docsIndexLinkTokenForRelPathV2");
  return `](./${basename(relPath)})`;
}

export function docsIndexOwnershipTokenForRelPathV2(relPath) {
  assertRelPathStringV2(relPath, "docsIndexOwnershipTokenForRelPathV2");
  return `\`${relPath}\``;
}

export function docsIndexLinkTokensForRelPathsV2(relPaths) {
  return toRelPathArrayOrThrowV2(relPaths, "docsIndexLinkTokensForRelPathsV2").map((relPath) =>
    docsIndexLinkTokenForRelPathV2(relPath)
  );
}

export function docsIndexOwnershipTokensForRelPathsV2(relPaths) {
  return toRelPathArrayOrThrowV2(relPaths, "docsIndexOwnershipTokensForRelPathsV2").map(
    (relPath) => docsIndexOwnershipTokenForRelPathV2(relPath)
  );
}
