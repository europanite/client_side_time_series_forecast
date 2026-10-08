# VRM co-speech gestures

The avatar now animates from the eight **actual narrated caption start times**.
`video/scripts/narration.mjs` creates those times from Playwright's recording,
and `capture-continuous.mjs` forwards them to the private VRM recorder.

The dependency-free `video/avatar/motion.mjs` defines eight modest expressive
poses: a curious tilt, presenting the forecast, indicating the CSV,
illustrating model choices, affirming local training, presenting results,
explaining browser-only processing, and directing attention to the QR code on the viewer's right.

It also adds a breathing motion, subtle head/torso movement, irregular blinks,
a conditional happy expression, and smoothed motion transitions. Piper's real
narration WAV continues to control mouth movement. Motion is deterministic so
re-rendering the same video produces the same poses.

Change the `SCENE_GESTURES` offsets in `motion.mjs` to tune the motions. Each
angle is in **radians** relative to the relaxed VRM normalized humanoid pose.
Start with small adjustments; large upper-arm changes can self-intersect with
specific VRM character meshes. An optional expression is only activated when
the chosen model supports it. The eight scene labels remain in `ad-script.mjs`.

These are authored, scene-aware gestures—not AI-generated speech-to-motion and
not physics-based motion capture. The routine does not change the 40-second
video format or add an external API/service.

Tests, from the repository root:

```bash
node --test video/avatar/motion.test.mjs video/scripts/avatar-motion-pipeline.test.mjs
```

Rebuild the video Docker image to bundle the new `motion.mjs` import.

## VRM 1.0 axes (important)

The animation uses `getNormalizedBoneNode()`, **not** `getRawBoneNode()`.
VRM 1.0 looks toward **+Z**; model-left points **+X**, model-right **-X**.
The normalized arm rest pose is a horizontal T-pose. With Three.js Euler
`XYZ`, bend the elbows with **Y** (left negative, right positive),
bring both lowered arms forward with upper-arm **negative X**, and change
sideways arm elevation with upper-arm **Z**. A Z-only elbow adjustment, as in
the original patch, makes straight-arms swing sideways instead of bending.

To check this character's actual result, rebuild the 40-second video and
inspect the scene at ~16 s, 24 s and 28 s. Motion curves are deterministic
and are tested with simple forward-kinematics probes. This is not a substitute
for testing the original VRM 1.0 mesh, spring bones or self-occlusion.

For optional learned-motion playback, see [../emage/README.md](../emage/README.md).
