import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildVoiceCues, buildAudioFilter, buildMuxArgs, replaceFileAcrossMounts, SPEECH_BY_CAPTION } from './narration.mjs';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AD_SCRIPT } from './ad-script.mjs';

const captions = Object.keys(SPEECH_BY_CAPTION).map((text, i) => ({
  text, elapsedSeconds: [1.8, 6.5, 11.0, 15.0, 21.8, 25.5, 29.4, 35.8][i],
}));

test('eight voice cues align with recorded caption events', () => {
  const cues = buildVoiceCues(captions, 40.4, 0);
  assert.equal(cues.length, 8);
  assert.equal(cues[0].speech, AD_SCRIPT[0]);
  cues.forEach((cue, i) => assert.equal(cue.caption, cue.speech, `Scene ${i + 1} mismatch`));
  assert.ok(cues[0].startSeconds > 1.65 && cues[0].startSeconds < 1.85);
  assert.ok(cues[7].slotSeconds >= 0.2);
  assert.ok(cues[7].startSeconds < 40);
});

test('opening 1.8 seconds have no narration and no caption event', () => {
  const cues = buildVoiceCues(captions, 40.4, 0);
  assert.ok(cues[0].startSeconds >= 1.7 && cues[0].startSeconds < 1.9);
  const filter = buildAudioFilter(cues, [2,2,2,2,2,2,4.2,2]);
  const delays = [...filter.matchAll(/adelay=(\d+):all=1/g)].map(m => Number(m[1]));
  assert.equal(delays.length, 8);
  assert.ok(delays[0] >= 1700, 'first spoken sample must be delayed beyond the opening pause');
});

test('rejects unknown or out-of-order captions', () => {
  assert.throws(() => buildVoiceCues([{text: 'unknown', elapsedSeconds: 1}], 40, 0));
  const backwards = captions.map(c => ({...c}));
  backwards[2].elapsedSeconds = 2;
  assert.throws(() => buildVoiceCues(backwards, 40));
  const reordered = captions.map(c => ({...c}));
  [reordered[1], reordered[2]] = [reordered[2], reordered[1]];
  assert.throws(() => buildVoiceCues(reordered, 40), /out-of-order/);
});

test('audio filter mixes all eight clips, fits timeline, and preserves 40 seconds', () => {
  const cues = buildVoiceCues(captions, 40.4, 0);
  const filt = buildAudioFilter(cues, [2, 2, 1.5, 2, 2, 2, 4.2, 2]);
  assert.match(filt, /amix=inputs=8/);
  assert.match(filt, /atrim=duration=40/);
  assert.match(filt, /adelay=\d+:all=1/);
  const args = buildMuxArgs('video.mp4', Array(8).fill('test.wav'), 'out.mp4', cues, [2,2,2,2,2,2,4.2,2]);
  assert.deepEqual(args.slice(-2), ['+faststart', 'out.mp4']);
  assert.ok(args.includes('copy'));
  assert.ok(args.includes('aac'));
});

test('rejects speech that must be sped up excessively', () => {
  const cues = buildVoiceCues(captions, 40.4, 0);
  assert.throws(() => buildAudioFilter(cues, [30,2,2,2,2,2,2,2]), /too long/);
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


test('all eight on-screen captions exactly match the spoken English script', async () => {
  const capture = await readFile(new URL('./capture-continuous.mjs', import.meta.url), 'utf8');
  assert.equal(AD_SCRIPT.length, 8);
  assert.equal(new Set(AD_SCRIPT).size, AD_SCRIPT.length);
  assert.deepEqual(Object.keys(SPEECH_BY_CAPTION), AD_SCRIPT);
  assert.deepEqual(Object.values(SPEECH_BY_CAPTION), AD_SCRIPT);
  AD_SCRIPT.forEach((line, i) => {
    assert.match(capture, new RegExp(`showCaption\\(AD_SCRIPT\\[${i}\\]\\)`));
    assert.ok(line.trim());
  });
  assert.ok(AD_SCRIPT.join(' ').split(/\s+/).length <= 100);
  assert.match(AD_SCRIPT[1], /sales, stock prices/i);
  assert.match(AD_SCRIPT[2], /No account/);
  for (const model of ['XGBoost', 'LightGBM', 'VARMA', 'Chronos Two']) {
    assert.ok(AD_SCRIPT[3].includes(model));
  }
  assert.match(AD_SCRIPT[4], /locally/i);
  assert.match(AD_SCRIPT[5], /sixteen predictions/i);
  assert.equal(AD_SCRIPT[6], 'This tool is completely free and safe because it runs only on your web browser.');
  assert.match(AD_SCRIPT[7], /data stays private/i);
  // Publication review: this strong safety statement is user-requested, not independently verified.
});
