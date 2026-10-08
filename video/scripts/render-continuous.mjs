/** Convert one UNINTERRUPTED real Playwright WebM recording to a 40-second MP4. */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { FRAME_RATE, FRAME_SIZE, VIDEO_SECONDS } from './timeline.mjs';
const exec = promisify(execFile);

/** Browser MediaRecorder WebMs often omit Matroska's optional Duration element. */
export function durationFromPackets(packets) {
  let start = Infinity;
  let end = -Infinity;
  for (const packet of packets) {
    const pts = Number(packet.pts_time);
    if (!Number.isFinite(pts)) continue;
    const packetLength = Number(packet.duration_time);
    start = Math.min(start, pts);
    end = Math.max(end, pts + (Number.isFinite(packetLength) && packetLength > 0 ? packetLength : 0));
  }
  const seconds = end - start;
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

export async function probeDuration(path) {
  const { stdout } = await exec('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1', path,
  ]);
  const formatDuration = Number(stdout.trim());
  if (Number.isFinite(formatDuration) && formatDuration > 0) return formatDuration;

  // MediaRecorder's WebM can be fully decodable while `format.duration` is N/A.
  // Derive playback length from its actual video packet timestamps instead.
  const { stdout: packetJson } = await exec('ffprobe', [
    '-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'packet=pts_time,duration_time', '-of', 'json', path,
  ], { maxBuffer: 16 * 1024 * 1024 });
  const seconds = durationFromPackets(JSON.parse(packetJson).packets ?? []);
  if (seconds === null) {
    throw new Error(`Cannot determine recorded video duration for ${path}: ` +
      `format=${stdout.trim()}; no valid video packet timestamps`);
  }
  console.log(`WebM duration from packet timestamps: ${seconds.toFixed(3)}s (${path})`);
  return seconds;
}

export function buildContinuousFfmpegArgs(rawPath, outputPath, rawSeconds, introTrimSeconds = 0) {
  if (!Number.isFinite(rawSeconds) || rawSeconds <= 0) throw new Error('Expected positive WebM duration');
  if (!Number.isFinite(introTrimSeconds) || introTrimSeconds < 0 || introTrimSeconds >= rawSeconds) {
    throw new Error('Invalid introduction trim duration');
  }
  const contentSeconds = rawSeconds - introTrimSeconds;
  // If training takes longer than the planned 40 seconds, accelerate playback
  // rather than cutting out the real training/forecast UI interaction.
  const ptsScale = VIDEO_SECONDS / contentSeconds;
  const vf = [
    ...(introTrimSeconds > 0 ? [`trim=start=${introTrimSeconds.toFixed(4)}`] : []),
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

export async function renderContinuous(rawPath, outputPath, introTrimSeconds = 0) {
  const rawSeconds = await probeDuration(rawPath);
  const args = buildContinuousFfmpegArgs(rawPath, outputPath, rawSeconds, introTrimSeconds);
  await exec('ffmpeg', args, { maxBuffer: 1024 * 1024 });
  const finalSeconds = await probeDuration(outputPath);
  if (Math.abs(finalSeconds - VIDEO_SECONDS) > 0.01) {
    throw new Error(`Expected a ${VIDEO_SECONDS}s MP4; got ${finalSeconds}s`);
  }
  return {
    rawSeconds,
    contentSeconds: rawSeconds - introTrimSeconds,
    outputSeconds: finalSeconds,
    playbackSpeed: Number(((rawSeconds - introTrimSeconds) / VIDEO_SECONDS).toFixed(5)),
  };
}
