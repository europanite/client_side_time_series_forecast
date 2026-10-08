#!/usr/bin/env bash
# Run in a separately provisioned PantoMatrix Python environment.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
: "${PANTOMATRIX_DIR:?Set PANTOMATRIX_DIR to a local PantoMatrix checkout with dependencies installed}"
if [[ ! -f "$PANTOMATRIX_DIR/test_emage_audio.py" ]]; then
  echo "Missing test_emage_audio.py in PANTOMATRIX_DIR=$PANTOMATRIX_DIR" >&2; exit 2
fi
if [[ ! -s "$ROOT/video/output/intermediate/narration.wav" ]]; then
  echo 'Generate the narrated demo first (narration.wav is missing)' >&2; exit 2
fi
mkdir -p "$ROOT/video/output/intermediate/emage"
cd "$PANTOMATRIX_DIR"
"${EMAGE_PYTHON:-python}" test_emage_audio.py \
  --audio_folder "$ROOT/video/output/intermediate" \
  --save_folder "$ROOT/video/output/intermediate/emage"
test -s "$ROOT/video/output/intermediate/emage/narration_output.npz"
echo 'EMAGE motion ready for conversion.'
