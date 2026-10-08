/** Single source of truth for video deliverables and intermediate artifacts. */
import { join } from 'node:path';
import { existsSync, mkdirSync, renameSync } from 'node:fs';

export function videoPaths(outputDirectory) {
  const intermediate = join(outputDirectory, 'intermediate');
  return Object.freeze({
    intermediate,
    finalVideo: join(outputDirectory, 'video.mp4'),
    finalPreview: join(outputDirectory, 'preview.png'),
    evidence: join(outputDirectory, 'evidence.json'),
    browserRecording: join(intermediate, 'browser-ui.webm'),
    narration: join(intermediate, 'narration.wav'),
    narratedFallback: join(intermediate, 'narrated-without-avatar.mp4'),
    avatarRecording: join(intermediate, 'avatar-green-screen.webm'),
    avatarPreview: join(intermediate, 'avatar-green-screen-preview.png'),
    captureFailure: join(intermediate, 'capture-failure.png'),
  });
}

/** Preserve old flat-layout debug files under intermediate/legacy/. Never delete them. */
const LEGACY_FILES = [
  'video_continuous_raw.webm', 'video_narration.wav', 'video_narrated_no_avatar.mp4',
  'video_avatar_raw.webm', 'video_avatar_preview.png', 'video_final_preview.png',
  'xgboost_continuous_raw.webm', 'xgboost_narration.wav',
  'xgboost_narrated_no_avatar.mp4', 'xgboost_avatar_raw.webm',
  'xgboost_avatar_preview.png', 'xgboost_final_preview.png',
  'capture-evidence.json', 'capture-continuous-evidence.json',
  'capture-failed.png', 'capture-continuous-failed.png',
  'video_30s.mp4', 'xgboost_30s.mp4', 'xgboost_continuous_30s.mp4',
];

export function archiveLegacyFiles(outputDirectory) {
  const legacyDirectory = join(outputDirectory, 'intermediate', 'legacy');
  let moved = 0;
  for (const filename of LEGACY_FILES) {
    const source = join(outputDirectory, filename);
    if (!existsSync(source)) continue;
    mkdirSync(legacyDirectory, {recursive: true});
    let destination = join(legacyDirectory, filename);
    let n = 1;
    while (existsSync(destination)) {
      destination = join(legacyDirectory, `${n++}-${filename}`);
    }
    renameSync(source, destination);
    moved++;
  }
  return moved;
}
