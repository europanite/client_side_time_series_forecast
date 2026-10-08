# YouTube demo: 40 seconds

The generated video uses **the real browser interface** (CSV, target, four model choices,
XGBoost train and 16-step forecast), plus the lip-synced VRM avatar.

## Storyboard (approximate elapsed seconds)

- 0–1.8s: silent UI opening (no subtitle, no narration)
- 1.8–6.5s: question / hook
- 6.5–11s: sales and stock-price forecasting
- 11–15s: load a CSV, no registration
- 15–21.8s: four real selectable models (XGBoost, LightGBM, VARMA, Chronos-2)
- 21.8–25.5s: local XGBoost training
- 25.5–29.4s: actual 16-point forecast
- 29.4–35.8s: requested free/browser-only sentence
- 35.8–40s: privacy, QR, and link to the tool

Actual caption/audio/avatar cue starts track the recorded UI timing.

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
Edit the eight voice/caption lines in `video/scripts/ad-script.mjs`.
`video/scripts/capture-continuous.mjs` displays them and
`video/scripts/narration.mjs` sends the identical text to Piper.

**Safety wording:** the narration uses a user-requested absolute safety
claim; browser-only execution cannot by itself guarantee complete safety.
