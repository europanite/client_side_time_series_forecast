/** Voice-over that tracks REAL browser caption changes after time compression. */
import { execFile } from 'node:child_process';
import { copyFile, mkdtemp, rename, rm, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { promisify } from 'node:util';
import { probeDuration } from './render-continuous.mjs';
import { VIDEO_SECONDS } from './timeline.mjs';
import { videoPaths } from './video-paths.mjs';

const exec = promisify(execFile);

// Spoken English is intentionally accessible to a nontechnical audience.
// Keep these keys identical to the page caption strings in capture-continuous.mjs.
export const SPEECH_BY_CAPTION = Object.freeze({
  // Short, separated phrases give Piper time to pronounce the project name.
  'client_side_time_series_forecast': 'Client side. Time series. Forecast.',
  'Forecast sales, stock prices, and more.': 'Predict sales, stock prices, and more, in your browser.',
  'Open a CSV file. No account needed.': 'No account needed. Just open a C S V file.',
  '4 models. Choose the one you want.': 'Four models to choose from: X G Boost, Light G B M, Varma, and Chronos two.',
  'Here, XGBoost learns on your computer.': 'Here, X G Boost learns from past data on your computer.',
  'See the next 16 predictions.': 'See the next sixteen predicted values.',
  'NO DATA UPLOAD. Scan to try it free.':
    'No data upload. Scan to try it for free.',
});

export function buildVoiceCues(captions, rawSeconds, leadInSeconds = 0) {
  if (!Array.isArray(captions) || captions.length !== 7) {
    throw new Error('Expected seven recorded caption events');
  }
  if (!Number.isFinite(rawSeconds) || rawSeconds <= 0 ||
      !Number.isFinite(leadInSeconds) || leadInSeconds < 0) {
    throw new Error('Invalid recording timing');
  }
  const starts = captions.map(({ text, elapsedSeconds }) => {
    if (!Object.hasOwn(SPEECH_BY_CAPTION, text)) throw new Error(`Unexpected caption: ${text}`);
    if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0) throw new Error('Invalid caption time');
    return ((leadInSeconds + elapsedSeconds) / rawSeconds) * VIDEO_SECONDS;
  });
  const cues = captions.map(({ text }, i) => ({
    caption: text,
    speech: SPEECH_BY_CAPTION[text],
    startSeconds: Math.max(0, Math.min(VIDEO_SECONDS - 0.15, starts[i])),
    // Reserve 100 ms of silence before the next caption if possible.
    slotSeconds: Math.max(0.2, (i + 1 < starts.length ? starts[i + 1] : VIDEO_SECONDS) - starts[i] - 0.10),
  }));
  for (let i = 1; i < cues.length; i++) {
    if (cues[i].startSeconds <= cues[i - 1].startSeconds) {
      throw new Error('Caption events are not strictly increasing');
    }
  }
  return cues;
}

export function buildAudioFilter(cues, durations) {
  if (cues.length !== 7 || durations.length !== 7) throw new Error('Require seven voice clips');
  const steps = [];
  const tracks = [];
  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    const duration = durations[i];
    if (!Number.isFinite(duration) || duration <= 0) throw new Error('Empty speech recording');
    const room = Math.max(0.2, Math.min(cue.slotSeconds, VIDEO_SECONDS - cue.startSeconds - 0.10));
    const tempo = Math.max(1, duration / room);
    // An unusually long synthesis would sound unnatural if compressed too much.
    if (tempo > 2.0) {
      throw new Error(`Narration is too long for scene ${i + 1}: ${tempo.toFixed(2)}x; shorten its spoken text`);
    }
    const playable = Math.min(duration / tempo, room);
    const delay = Math.round(cue.startSeconds * 1000);
    steps.push(`[${i + 1}:a]aresample=48000,atempo=${tempo.toFixed(5)},` +
      `atrim=duration=${playable.toFixed(4)},asetpts=PTS-STARTPTS,` +
      `afade=t=in:st=0:d=0.05,adelay=${delay}:all=1[a${i}]`);
    tracks.push(`[a${i}]`);
  }
  steps.push(`${tracks.join('')}amix=inputs=${cues.length}:normalize=0:duration=longest,` +
    `alimiter=limit=0.95,apad,atrim=duration=${VIDEO_SECONDS},asetpts=PTS-STARTPTS[voice]`);
  return steps.join(';');
}

export function buildMuxArgs(video, wavPaths, output, cues, durations) {
  return [
    '-hide_banner', '-loglevel', 'error', '-y', '-i', video,
    ...wavPaths.flatMap(path => ['-i', path]),
    '-filter_complex', buildAudioFilter(cues, durations),
    '-map', '0:v:0', '-map', '[voice]',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k',
    '-t', String(VIDEO_SECONDS), '-movflags', '+faststart', output,
  ];
}

/**
 * Copy into the destination's filesystem, then replace the existing file atomically.
 * The rendered video lives under /tmp and /out may be a Docker bind mount;
 * rename(/tmp/video, /out/video) fails with EXDEV across these filesystems.
 */
export async function replaceFileAcrossMounts(source, destination) {
  const staging = `${destination}.${randomUUID()}.tmp`;
  try {
    await copyFile(source, staging);
    await rename(staging, destination);
  } finally {
    await rm(staging, { force: true });
  }
}

export async function addNarrationToVideo(videoPath, captions, rawSeconds, leadInSeconds, outputDir) {
  const cues = buildVoiceCues(captions, rawSeconds, leadInSeconds);
  const workdir = await mkdtemp(join(tmpdir(), 'xgboost-piper-'));
  const voice = process.env.VIDEO_VOICE || 'en_US-lessac-medium';
  try {
    const manifest = join(workdir, 'cues.json');
    await writeFile(manifest, JSON.stringify(cues), 'utf8');
    await exec('python3', [
      'scripts/synthesize-narration.py', '--manifest', manifest,
      '--output-dir', workdir, '--model-dir', process.env.VIDEO_VOICE_DIR || '/voices',
      '--voice', voice,
    ], { maxBuffer: 1024 * 1024 * 4 });
    const wavPaths = cues.map((_, i) => join(workdir, `narration_${String(i).padStart(2, '0')}.wav`));
    const durations = await Promise.all(wavPaths.map(probeDuration));
    const narrated = join(workdir, 'voiced.mp4');
    await exec('ffmpeg', buildMuxArgs(videoPath, wavPaths, narrated, cues, durations),
      { maxBuffer: 1024 * 1024 * 4 });
    const outputSeconds = await probeDuration(narrated);
    if (Math.abs(outputSeconds - VIDEO_SECONDS) > 0.06) throw new Error('Narrated MP4 duration is incorrect');
    const { stdout } = await exec('ffprobe', [
      '-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=codec_name',
      '-of', 'default=nokey=1:noprint_wrappers=1', narrated,
    ]);
    if (stdout.trim() !== 'aac') throw new Error('Output MP4 has no AAC narration track');
    await replaceFileAcrossMounts(narrated, videoPath);
    const soundtrack = videoPaths(outputDir).narration;
    await exec('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', videoPath,
      '-vn', '-c:a', 'pcm_s16le', soundtrack]);
    console.log(`Narration: ${voice}; ${basename(soundtrack)}; seven timed cues`);
    return { enabled: true, voice, cues, audioFile: basename(soundtrack) };
  } finally {
    await rm(workdir, { recursive: true, force: true });
  }
}
