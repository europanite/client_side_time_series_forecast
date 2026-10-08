/** Select screenshot montage or continuous browser recording. */
const mode = process.env.VIDEO_CAPTURE_MODE ?? 'continuous';
if (mode === 'continuous') {
  await import('./capture-continuous.mjs');
} else if (mode === 'stills') {
  await import('./capture.mjs');
} else {
  console.error(`Unknown VIDEO_CAPTURE_MODE=${mode}. Choose continuous or stills.`);
  process.exitCode = 2;
}
