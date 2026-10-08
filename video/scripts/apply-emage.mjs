/** Composite already-recorded narration + experimental EMAGE VRM motion.
 * Never re-record the browser or re-synthesize the WAV, so audio stays synced.
 */
import { existsSync, readFileSync } from 'node:fs';
import { copyFile, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { overlayTalkingAvatar } from './avatar-overlay.mjs';
import { VIDEO_SECONDS } from './timeline.mjs';
import { videoPaths } from './video-paths.mjs';

const output = process.env.OUTPUT_DIR || '/out';
const paths = videoPaths(output);
const evidence = JSON.parse(readFileSync(paths.evidence, 'utf8'));
const cues = evidence.narration?.cues;
if (evidence.outputSeconds !== VIDEO_SECONDS || !Array.isArray(cues) || cues.length !== 8) {
  throw new Error('Expected a completed 40-second narrated demo with eight cues');
}
for (const path of [paths.narratedFallback, paths.narration]) {
  if (!existsSync(path)) throw new Error(`Required original recording missing: ${path}`);
}
if (process.env.VIDEO_MOTION_MODE !== 'emage') throw new Error('Set VIDEO_MOTION_MODE=emage');
const staging = join(output, `video.emage.${randomUUID()}.tmp.mp4`);
try {
  await copyFile(paths.narratedFallback, staging);
  const avatar = await overlayTalkingAvatar(staging, paths.narration, output, cues);
  await rename(staging, paths.finalVideo);
  console.log(`EMAGE composite saved: ${paths.finalVideo}`);
  // Do not modify evidence.json here: old evidence documents the original capture.
  console.log(`Animation source: ${avatar.synchronization}`);
} finally {
  await rm(staging, {force:true});
}
