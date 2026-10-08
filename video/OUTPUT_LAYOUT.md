# YouTube demo: 30 seconds

The generated video uses **the real browser interface** (CSV, target, four model choices,
XGBoost train and 16-step forecast), plus the lip-synced VRM avatar.

## Storyboard

- 0–3.5s: purpose — sales, stock prices, energy demand and other time series
- 3.5–8s: load a CSV, no registration
- 8–15.5s: show four real selectable models (XGBoost, LightGBM, VARMA, Chronos-2)
- 15.5–20s: XGBoost training on the viewer's device
- 20–26s: actual 16-point forecast
- 26–30s: brand, clear URL, scannable QR code, no-upload message

The QR image at `video/avatar/forecast-site-qr.svg` contains
`https://europanite.github.io/client_side_time_series_forecast/`.
Its content is stored locally and does not depend on a QR API.

## Local avatar model

Copy or move your existing model to `video/avatar/avatar.vrm`:

```bash
mkdir -p video/avatar
mv video/assets/avatar.vrm video/avatar/avatar.vrm
# Or copy the VRM you originally downloaded into video/avatar/avatar.vrm
```

## Output files

```text
video/output/
  video.mp4                        # Publish this MP4 to YouTube
  preview.png                      # Thumbnail/quick check
  evidence.json                    # Verified actions + timing
  intermediate/
    browser-ui.webm                # Original moving React UI
    narration.wav                  # Final Piper narration
    narrated-without-avatar.mp4    # Backup if avatar compositing fails
    avatar-green-screen.webm       # VRM render before keying
    avatar-green-screen-preview.png # Diagnostic only (green is intentional)
    capture-failure.png            # Present only after a capture error
```

Old flat-layout debug files from earlier pipeline runs are moved without deletion
to `video/output/intermediate/legacy/` (existing backups are never overwritten).

Run from the project root:

```bash
LOCAL_UID="$(id -u)" LOCAL_GID="$(id -g)" \
docker compose -f docker-compose.yml -f docker-compose.video.yml \
  up --build --abort-on-container-exit --exit-code-from video
```

If your avatar file is unavailable, set `VIDEO_AVATAR_ENABLED=0` to make a voice-only video.
Edit the seven voice/caption lines in `video/scripts/ad-script.mjs`.
`video/scripts/capture-continuous.mjs` displays them and
`video/scripts/narration.mjs` sends the identical text to Piper.
