import { spawn } from 'node:child_process';
import { statSync } from 'node:fs';
import { SCENES, VIDEO_SECONDS, FRAME_RATE, CLIP_SECONDS, FADE_SECONDS, checkTimeline } from './timeline.mjs';

const FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';

function escapeDrawtext(value) {
  // Escape values embedded in an FFmpeg filter expression. Captions are a fixed
  // allowlisted set from timeline.mjs, never input from an uploaded CSV.
  return value.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'").replace(/,/g, '\\,').replace(/%/g, '\\%');
}

export function buildFfmpegArgs(shots, outputFile) {
  checkTimeline();
  if (shots.length !== SCENES.length) throw new Error(`Expected ${SCENES.length} real screenshots, got ${shots.length}`);
  const args = ['-hide_banner', '-loglevel', 'error', '-y'];
  for (const shot of shots) {
    if (!statSync(shot).isFile()) throw new Error(`Missing real screenshot: ${shot}`);
    args.push('-loop', '1', '-framerate', String(FRAME_RATE), '-t', String(CLIP_SECONDS), '-i', shot);
  }

  const filters = SCENES.map(({ caption }, index) => {
    const text = escapeDrawtext(caption);
    return `[${index}:v]fps=${FRAME_RATE},scale=1280:720,setsar=1,format=yuv420p,` +
      `drawbox=x=0:y=610:w=iw:h=110:color=black@0.80:t=fill,` +
      `drawtext=fontfile=${FONT}:text='${text}':fontsize=33:fontcolor=white:` +
      `x=(w-text_w)/2:y=641[v${index}]`;
  });
  let combined = 'v0';
  for (let i = 1; i < SCENES.length; i++) {
    const name = i === SCENES.length - 1 ? 'end' : `xf${i}`;
    filters.push(`[${combined}][v${i}]xfade=transition=fade:duration=${FADE_SECONDS}:offset=${i * (CLIP_SECONDS - FADE_SECONDS)}[${name}]`);
    combined = name;
  }
  args.push('-filter_complex', filters.join(';'), '-map', '[end]',
    '-t', String(VIDEO_SECONDS), '-an', '-c:v', 'libx264', '-preset', 'medium',
    '-crf', '20', '-pix_fmt', 'yuv420p', '-r', String(FRAME_RATE),
    '-movflags', '+faststart', outputFile);
  return args;
}

export async function render(shots, outputFile) {
  const args = buildFfmpegArgs(shots, outputFile);
  await new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args, { stdio: 'inherit' });
    proc.on('error', reject);
    proc.on('exit', code => code === 0 ? resolve() : reject(new Error(`ffmpeg exited with status ${code}`)));
  });
}
