# Experimental EMAGE → VRM 1.0 integration

This is an **opt-in experiment**, not a completed SMPL-X-to-VRM retargeter.
[PantoMatrix / EMAGE](https://github.com/PantoMatrix/PantoMatrix) learns 3D speech
motion and writes a 30-fps SMPL-X `poses` array in its `*_output.npz`. The
adapter currently maps a few SMPL-X joint **changes relative to the opening
neutral pose** to restrained VRM normalized-bone Euler offsets. It does not
correct SMPL-X bind poses, skinning, jaw, fingers, axis conventions or facial
blendshapes; accuracy is not guaranteed and it will NOT faithfully reconstruct
human mocap. Compare its output visually against procedural gestures.

## Workflow (all EMAGE steps in Docker Compose)

There is **no host Python, conda, or PantoMatrix checkout requirement**.
First create the **40-second** narrated source video using the existing demo
pipeline (the narration WAV, clean narrated MP4 and `evidence.json` must exist):

```bash
docker compose -f docker-compose.yml -f docker-compose.video.yml \
  up --build --abort-on-container-exit --exit-code-from video
```

To infer and combine speech-driven motion using **NVIDIA GPU**, run:

```bash
# First verify host GPU integration: docker run --rm --gpus all \
#   nvidia/cuda:11.7.1-base-ubuntu22.04 nvidia-smi
LOCAL_UID="$(id -u)" LOCAL_GID="$(id -g)" \
docker compose -f docker-compose.emage.yml -f docker-compose.emage.gpu.yml \
  up --build --abort-on-container-failure
```

To run **without an NVIDIA Container Toolkit** (CPU; considerably slower),
omit the GPU override:

```bash
LOCAL_UID="$(id -u)" LOCAL_GID="$(id -g)" \
docker compose -f docker-compose.emage.yml \
  up --build --abort-on-container-failure
```

The `emage-infer` image fetches PantoMatrix source at **image build time**,
then downloads `H-Liu1997/emage_audio` weights through Hugging Face at **first
inference**. The named Docker volume `emage_hf_cache` preserves those large
model files between runs. Network access is needed for the first build/model
download; no online inference API is called. You can pin the upstream code
revision for reproducibility with `PANTOMATRIX_REF=<git-sha>` before building.

Compose executes the three **one-shot jobs** in this order, waiting for each
to exit successfully:

1. `emage-infer`: the exact `narration.wav` → `intermediate/emage/narration_output.npz`
2. `emage-convert`: NPZ → `intermediate/emage-vrm-motion.json`
3. `emage-apply`: use the original clean narrated video and new motion → `video.mp4`

The source media is not re-recorded or re-synthesized. The inference NPZ is
associated with the WAV's SHA-256; rerunning with unchanged audio can reuse it.
If inference fails, `emage-convert` and `emage-apply` do not start.

**Do not use `--abort-on-container-exit` or `--exit-code-from` for this pipeline.**
Unlike the original capture workflow, EMAGE consists of three one-shot
services; those flags stop everything when the *first* service exits, before
its dependents have run. Use `--abort-on-container-failure` as shown above.

To debug an individual step without the other services:

```bash
docker compose -f docker-compose.emage.yml run --rm --build --no-deps emage-infer
docker compose -f docker-compose.emage.yml run --rm --no-deps emage-convert
docker compose -f docker-compose.emage.yml run --rm --no-deps emage-apply
```

To see whether the NPZ and manifest were produced:

```bash
ls -lh video/output/intermediate/emage/narration_output.npz \
       video/output/intermediate/emage-vrm-motion.json \
       video/output/video.mp4
```

### Build requirements

The Docker image uses PyTorch 2.0.0 / CUDA 11.7 and a small pinned set of
inference dependencies rather than PantoMatrix's Colab `setup.sh`. This image
is **large** and CPU inference can be very slow. NVIDIA GPU runs require the
NVIDIA Container Toolkit and a compatible driver on the host.

We have not run the upstream checkpoint inference inside this development
container. Package changes upstream, weight availability, and 40-second
inference stability must be validated on a machine that can build the image.

## Safeguards / limitations

- This is **offline video authoring**; browser forecasting itself still runs
  locally without any server. EMAGE inference is a separate opt-in process.
- The motion manifest embeds a SHA-256 of `narration.wav`: the video stage
  rejects a different WAV instead of silently using stale motion.
- It rejects wrong FPS/frame count, absent joints and invalid or excessive
  rotation samples; all mapped rotations are smoothed and capped.
- SMPL-X joint axis-angle rotations are **not** VRM 1.0 bone-local Euler
  rotations. The conversion is a restrained approximation and still needs
  coordinate/bind-pose calibrated retargeting for physically correct motion.
- Each inference may require downloading large third-party model weights.
  Do not commit the `.npz`, model weights, or generated media.
- PantoMatrix's GitHub repository does not visibly provide a root `LICENSE`
  file as of this integration. Confirm the legal terms for the source, trained
  checkpoints and datasets before redistributing anything or using it in a
  monetized/promotional video.
- Full EMAGE inference in the new container was not tested as part of this patch.
  Adapter unit tests do not establish that upstream model inference succeeds.

### Tests

```bash
node --test video/avatar/emage-motion.test.mjs video/scripts/avatar-motion-pipeline.test.mjs
python -m unittest discover -s video/emage/tests -p 'test_*.py' -v
```

Or run the converter's Python tests in its Docker image:

```bash
docker compose -f docker-compose.emage.yml run --rm emage-convert \
  --help
```
