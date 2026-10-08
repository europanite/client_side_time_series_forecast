import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildVoiceCues, buildAudioFilter, buildMuxArgs, replaceFileAcrossMounts, SPEECH_BY_CAPTION } from './narration.mjs';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AD_SCRIPT } from './ad-script.mjs';

const captions = Object.keys(SPEECH_BY_CAPTION).map((text, i) => ({
  text, elapsedSeconds: [0.01, 5.5, 9.5, 13.5, 19.0, 22.5, 26.0][i],
}));

test('seven voice cues align with recorded caption events', () => {
  const cues = buildVoiceCues(captions, 32, 1);
  assert.equal(cues.length, 7);
  assert.equal(cues[0].speech, AD_SCRIPT[0]);
  cues.forEach((cue, i) => assert.equal(cue.caption, cue.speech, `Scene ${i + 1} mismatch`));
  assert.ok(cues[0].startSeconds > 0.9 && cues[0].startSeconds < 1);
  assert.ok(cues[6].slotSeconds >= 0.2);
  assert.ok(cues[6].startSeconds < 30);
});

test('rejects unknown or out-of-order captions', () => {
  assert.throws(() => buildVoiceCues([{text: 'unknown', elapsedSeconds: 1}], 30, 0));
  const backwards = captions.map(c => ({...c}));
  backwards[2].elapsedSeconds = 2;
  assert.throws(() => buildVoiceCues(backwards, 30));
  const reordered = captions.map(c => ({...c}));
  [reordered[1], reordered[2]] = [reordered[2], reordered[1]];
  assert.throws(() => buildVoiceCues(reordered, 30), /out-of-order/);
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


test('all seven on-screen captions exactly match the spoken English script', async () => {
  const capture = await readFile(new URL('./capture-continuous.mjs', import.meta.url), 'utf8');
  assert.equal(AD_SCRIPT.length, 7);
  assert.equal(new Set(AD_SCRIPT).size, AD_SCRIPT.length);
  assert.deepEqual(Object.keys(SPEECH_BY_CAPTION), AD_SCRIPT);
  assert.deepEqual(Object.values(SPEECH_BY_CAPTION), AD_SCRIPT);
  AD_SCRIPT.forEach((line, i) => {
    assert.match(capture, new RegExp(`showCaption\\(AD_SCRIPT\\[${i}\\]\\)`));
    assert.ok(line.trim());
  });
  assert.ok(AD_SCRIPT.join(' ').split(/\s+/).length <= 80);
  assert.match(AD_SCRIPT[1], /sales, stock prices/i);
  assert.match(AD_SCRIPT[2], /No account/);
  for (const model of ['XGBoost', 'LightGBM', 'VARMA', 'Chronos Two']) {
    assert.ok(AD_SCRIPT[3].includes(model));
  }
  assert.match(AD_SCRIPT[4], /locally/i);
  assert.match(AD_SCRIPT[5], /sixteen predictions/i);
  assert.match(AD_SCRIPT[6], /data stays private/i);
  assert.doesNotMatch(AD_SCRIPT.join(' '), /100% safe|completely safe|risk.free/i);
});
