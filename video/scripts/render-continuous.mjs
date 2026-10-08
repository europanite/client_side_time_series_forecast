/** Convert one UNINTERRUPTED real Playwright WebM recording to a 30-second MP4. */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { FRAME_RATE, FRAME_SIZE, VIDEO_SECONDS } from './timeline.mjs';
const exec = promisify(execFile);

export async function probeDuration(path) {
  const { stdout } = await exec('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1', path,
  ]);
  const seconds = Number(stdout.trim());
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new Error(`Invalid recorded duration for ${path}: ${stdout.trim()}`);
  }
  return seconds;
}

export function buildContinuousFfmpegArgs(rawPath, outputPath, rawSeconds) {
  if (!Number.isFinite(rawSeconds) || rawSeconds <= 0) throw new Error('Expected positive WebM duration');
  // If training takes longer than the planned 30 seconds, accelerate playback
  // rather than cutting out the real training/forecast UI interaction.
  const ptsScale = VIDEO_SECONDS / rawSeconds;
  const vf = [
    `setpts=${ptsScale.toFixed(10)}*(PTS-STARTPTS)`,
    `fps=${FRAME_RATE}`,
    `scale=${FRAME_SIZE.width}:${FRAME_SIZE.height}:flags=lanczos`,
    'setsar=1',
    // Cover small encoder timestamp variations by freezing the last genuine frame.
    'tpad=stop_mode=clone:stop_duration=1',
    `trim=duration=${VIDEO_SECONDS}`,
    'setpts=PTS-STARTPTS',
    'format=yuv420p',
  ].join(',');
  return [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-i', rawPath, '-an', '-vf', vf,
    '-frames:v', String(VIDEO_SECONDS * FRAME_RATE),
    '-r', String(FRAME_RATE),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outputPath,
  ];
}

export async function renderContinuous(rawPath, outputPath) {
  const rawSeconds = await probeDuration(rawPath);
  const args = buildContinuousFfmpegArgs(rawPath, outputPath, rawSeconds);
  await exec('ffmpeg', args, { maxBuffer: 1024 * 1024 });
  const finalSeconds = await probeDuration(outputPath);
  if (Math.abs(finalSeconds - VIDEO_SECONDS) > 0.01) {
    throw new Error(`Expected a ${VIDEO_SECONDS}s MP4; got ${finalSeconds}s`);
  }
  return {
    rawSeconds,
    outputSeconds: finalSeconds,
    playbackSpeed: Number((rawSeconds / VIDEO_SECONDS).toFixed(5)),
  };
}
