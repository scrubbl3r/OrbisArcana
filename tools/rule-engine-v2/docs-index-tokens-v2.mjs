import { basename } from "node:path";

export function docsIndexLinkTokenForRelPathV2(relPath) {
  return `](./${basename(String(relPath || ""))})`;
}

export function docsIndexOwnershipTokenForRelPathV2(relPath) {
  return `\`${String(relPath || "")}\``;
}
