import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildContinuousFfmpegArgs } from './render-continuous.mjs';
import { buildVoiceCues, SPEECH_BY_CAPTION } from './narration.mjs';
import { AD_SCRIPT } from './ad-script.mjs';

const capture = readFileSync(new URL('./capture-continuous.mjs', import.meta.url), 'utf8');

test('final recording trims setup frames so the persistent URL and QR start at frame zero', () => {
  const args = buildContinuousFfmpegArgs('recording.webm', 'video.mp4', 36, 3);
  const filters = args[args.indexOf('-vf') + 1];
  assert.match(filters, /^trim=start=3\.0000,setpts=1\.2121212121\*/);
  assert.match(capture, /renderContinuous\(RAW_FILE, VIDEO_FILE, leadInSeconds\)/);
  assert.match(capture, /__demo_brand img/);
  assert.doesNotMatch(capture, /__demo_intro|__demo_outro/);
});

test('hook precedes purpose, and voice aligns with on-screen captions', () => {
  assert.deepEqual(Object.keys(SPEECH_BY_CAPTION), AD_SCRIPT);
  assert.match(AD_SCRIPT[0], /browser forecast/);
  assert.ok(capture.indexOf('await holdUntil(OPENING_SILENCE_SECONDS)') < capture.indexOf('await showCaption(AD_SCRIPT[0])'));
  assert.ok(capture.indexOf('await showCaption(AD_SCRIPT[0])') <
            capture.indexOf('await showCaption(AD_SCRIPT[1])'));
  const raw = AD_SCRIPT.map((text,i) => ({text, elapsedSeconds:[1.8,6.5,11,15,21.8,25.5,29.4,35.8][i]}));
  const cues = buildVoiceCues(raw, 40, 0);
  assert.equal(cues.length, 8);
  assert.ok(cues[0].startSeconds >= 1.7 && cues[0].slotSeconds >= 4.5);
  cues.forEach(cue => assert.equal(cue.speech, cue.caption));
});
