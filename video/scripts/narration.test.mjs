import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildVoiceCues, buildAudioFilter, buildMuxArgs, replaceFileAcrossMounts, SPEECH_BY_CAPTION } from './narration.mjs';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const captions = Object.keys(SPEECH_BY_CAPTION).map((text, i) => ({
  text, elapsedSeconds: [0.01, 5.5, 9.5, 13.5, 19.0, 22.5, 26.0][i],
}));

test('seven voice cues align with recorded caption events', () => {
  const cues = buildVoiceCues(captions, 32, 1);
  assert.equal(cues.length, 7);
  assert.equal(cues[0].speech, 'Client side. Time series. Forecast.');
  assert.ok(cues[0].startSeconds > 0.9 && cues[0].startSeconds < 1);
  assert.ok(cues[6].slotSeconds >= 0.2);
  assert.ok(cues[6].startSeconds < 30);
});

test('rejects unknown or out-of-order captions', () => {
  assert.throws(() => buildVoiceCues([{text: 'unknown', elapsedSeconds: 1}], 30, 0));
  const backwards = captions.map(c => ({...c}));
  backwards[2].elapsedSeconds = 2;
  assert.throws(() => buildVoiceCues(backwards, 30));
});

test('audio filter mixes all seven clips, fits timeline, and preserves 30 seconds', () => {
  const cues = buildVoiceCues(captions, 32, 1);
  const filt = buildAudioFilter(cues, [2, 2, 1.5, 2, 2, 2, 2]);
  assert.match(filt, /amix=inputs=7/);
  assert.match(filt, /atrim=duration=30/);
  assert.match(filt, /adelay=\d+:all=1/);
  const args = buildMuxArgs('video.mp4', Array(7).fill('test.wav'), 'out.mp4', cues, [2,2,2,2,2,2,2]);
  assert.deepEqual(args.slice(-2), ['+faststart', 'out.mp4']);
  assert.ok(args.includes('copy'));
  assert.ok(args.includes('aac'));
});

test('rejects speech that must be sped up excessively', () => {
  const cues = buildVoiceCues(captions, 32, 1);
  assert.throws(() => buildAudioFilter(cues, [30,2,2,2,2,2,2]), /too long/);
});


test('replaceFileAcrossMounts replaces an existing output without staging leftovers', async () => {
  const sourceDir = await mkdtemp(join(tmpdir(), 'narration-source-'));
  const outputDir = await mkdtemp(join(tmpdir(), 'narration-output-'));
  try {
    const source = join(sourceDir, 'voiced.mp4');
    const dest = join(outputDir, 'video.mp4');
    await writeFile(source, Buffer.from('new video with speech'));
    await writeFile(dest, Buffer.from('old silent video'));

    await replaceFileAcrossMounts(source, dest);

    assert.equal((await readFile(dest)).toString(), 'new video with speech');
    assert.equal((await readFile(source)).toString(), 'new video with speech');
    assert.deepEqual(await readdir(outputDir), ['video.mp4']);
  } finally {
    await rm(sourceDir, { recursive: true, force: true });
    await rm(outputDir, { recursive: true, force: true });
  }
});


test('free and data-local claims are present in the actual captured captions and spoken lines', async () => {
  const { readFile } = await import('node:fs/promises');
  const capture = await readFile(new URL('./capture-continuous.mjs', import.meta.url), 'utf8');
  const keys = Object.keys(SPEECH_BY_CAPTION);
  assert.equal(keys.length, 7);
  for (const key of keys) assert.ok(capture.includes(`showCaption('${key}')`), `Missing UI caption: ${key}`);
  assert.match(keys[0], /client_side_time_series_forecast/);
  assert.match(SPEECH_BY_CAPTION[keys[0]], /Client side/);
  assert.match(keys[1], /Forecast sales/);
  assert.match(SPEECH_BY_CAPTION[keys[1]], /sales, stock prices/i);
  assert.match(keys[2], /No account/);
  assert.match(keys[3], /4 models/);
  for (const model of ['X G Boost', 'Light G B M', 'Varma', 'Chronos two']) {
    assert.ok(SPEECH_BY_CAPTION[keys[3]].includes(model), `Missing spoken model: ${model}`);
  }
  assert.match(keys[4], /your computer/i);
  assert.match(keys[6], /NO DATA UPLOAD/);
  assert.match(SPEECH_BY_CAPTION[keys[6]], /No data upload/);
  assert.doesNotMatch(Object.values(SPEECH_BY_CAPTION).join(' '), /100% safe|completely safe|risk.free/i);
});
