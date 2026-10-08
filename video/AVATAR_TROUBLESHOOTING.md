# Talking-avatar video: files and troubleshooting

The VRM character is filmed in a separate green-screen scene before being cut
out and composited over the **real browser UI**. These intermediate files are
**not** the deliverable:

- `video_avatar_preview.png`: *green-screen diagnostic*; green is intentional
- `video_avatar_raw.webm`: *green-screen source*; green is intentional, no narration
- `video_continuous_raw.webm`: *browser capture*; no narration or avatar

Open `video/output/video.mp4`, not those raw files.
After a successful avatar run, `video/output/video_final_preview.png`
contains an actual frame of the **finished composite** (no green background).

The pipeline saves `video/output/video_narrated_no_avatar.mp4` as soon as
narration succeeds, **before** it starts rendering the avatar. If the avatar
fails, this fallback remains playable with English speech. The last FFmpeg
error is now printed in full instead of being hidden.

To test the voice-only version without rendering the VRM:

```bash
VIDEO_AVATAR_ENABLED=0 docker compose -f docker-compose.yml \
  -f docker-compose.video.yml up --build --abort-on-container-exit \
  --exit-code-from video
```

For an avatar run, the VRM must be readable at `video/assets/Avatar_D_01.vrm`.
**Do not commit or redistribute the VRM model.** Its included metadata requires
credit and forbids redistribution. Completed videos display the creator credit.

The container writes to the host's `video/output` bind mount. To avoid padlock
icons from root-owned files, launch with your user/group IDs:

```bash
LOCAL_UID="$(id -u)" LOCAL_GID="$(id -g)" \
  docker compose -f docker-compose.yml -f docker-compose.video.yml \
  up --build --abort-on-container-exit --exit-code-from video
```

For files already owned by root, repair ownership once using:

```bash
sudo chown -R "$(id -u):$(id -g)" video/output
```

Check that the finished MP4 has both picture and speech:

```bash
ffprobe -v error -show_entries stream=codec_name,codec_type \
  -of table video/output/video.mp4
```
