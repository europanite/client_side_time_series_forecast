/** Select screenshot montage or continuous browser recording. */
import { execFileSync } from 'node:child_process';

// The container runs as root so Playwright/Piper voice caches remain writable.
// Restore host ownership for bind-mounted outputs even when rendering fails.
// Defaults to UID/GID 1000; override LOCAL_UID/LOCAL_GID in docker compose.
process.on('exit', () => {
  const uid = process.env.VIDEO_HOST_UID;
  const gid = process.env.VIDEO_HOST_GID;
  if (!/^\d+$/.test(uid ?? '') || !/^\d+$/.test(gid ?? '')) return;
  try {
    execFileSync('chown', ['-R', `${uid}:${gid}`, process.env.OUTPUT_DIR || '/out']);
  } catch (error) {
    console.error(`Could not restore output ownership: ${error.message}`);
  }
});

const mode = process.env.VIDEO_CAPTURE_MODE ?? 'continuous';
if (mode === 'continuous') {
  await import('./capture-continuous.mjs');
} else if (mode === 'stills') {
  await import('./capture.mjs');
} else {
  console.error(`Unknown VIDEO_CAPTURE_MODE=${mode}. Choose continuous or stills.`);
  process.exitCode = 2;
}
