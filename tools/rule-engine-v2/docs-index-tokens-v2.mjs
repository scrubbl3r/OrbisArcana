import { basename } from "node:path";

export function docsIndexLinkTokenForRelPathV2(relPath) {
  return `](./${basename(String(relPath || ""))})`;
}

export function docsIndexOwnershipTokenForRelPathV2(relPath) {
  return `\`${String(relPath || "")}\``;
}

export function docsIndexLinkTokensForRelPathsV2(relPaths) {
  return Array.from(relPaths || []).map((relPath) => docsIndexLinkTokenForRelPathV2(relPath));
}

export function docsIndexOwnershipTokensForRelPathsV2(relPaths) {
  return Array.from(relPaths || []).map((relPath) => docsIndexOwnershipTokenForRelPathV2(relPath));
}
