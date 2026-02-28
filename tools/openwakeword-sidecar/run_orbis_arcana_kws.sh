#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
MANIFEST_PATH="${REPO_ROOT}/tools/openwakeword-training/manifests/orbis-arcana-dev-spells.manifest.json"
MODELS_DIR="${REPO_ROOT}/assets/kws/openwakeword-models"

if [[ -d "${SCRIPT_DIR}/.venv" ]]; then
  # shellcheck disable=SC1091
  source "${SCRIPT_DIR}/.venv/bin/activate"
fi

echo "[oww-sidecar] models dir: ${MODELS_DIR}"
echo "[oww-sidecar] manifest: ${MANIFEST_PATH}"
echo "[oww-sidecar] put your spell model files (.tflite/.onnx) in ${MODELS_DIR} before starting"

python3 "${SCRIPT_DIR}/server.py" \
  --manifest "${MANIFEST_PATH}" \
  --threshold 0.10 \
  --token-threshold orbis=0.35 \
  --token-threshold ignis=0.10 \
  --token-threshold fridgis=0.10 \
  --token-threshold electrum=0.10 \
  --token-threshold sanctum=0.00 \
  --token-threshold rota=0.10 \
  --token-threshold vectus=0.00 \
  --token-threshold domus=0.12 \
  --cooldown-ms 300 \
  "$@"
