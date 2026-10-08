import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildContinuousFfmpegArgs } from './render-continuous.mjs';
import { buildVoiceCues, SPEECH_BY_CAPTION } from './narration.mjs';

const capture = readFileSync(new URL('./capture-continuous.mjs', import.meta.url), 'utf8');

test('final recording trims setup frames so the persistent URL and QR start at frame zero', () => {
  const args = buildContinuousFfmpegArgs('recording.webm', 'video.mp4', 36, 3);
  const filters = args[args.indexOf('-vf') + 1];
  assert.match(filters, /^trim=start=3\.0000,setpts=0\.9090909091\*/);
  assert.match(capture, /renderContinuous\(RAW_FILE, VIDEO_FILE, leadInSeconds\)/);
  assert.match(capture, /__demo_brand img/);
  assert.doesNotMatch(capture, /__demo_intro|__demo_outro/);
});

test('project name is spoken before the purpose and no dedicated title card is displayed', () => {
  const keys = Object.keys(SPEECH_BY_CAPTION);
  assert.equal(keys[0], 'client_side_time_series_forecast');
  assert.match(SPEECH_BY_CAPTION[keys[0]], /Client side\. Time series\. Forecast\./);
  assert.match(keys[1], /Forecast sales/);
  assert.ok(capture.indexOf("await showCaption('client_side_time_series_forecast')") <
            capture.indexOf("await showCaption('Forecast sales, stock prices, and more.')"));
  const raw = keys.map((text,i) => ({text, elapsedSeconds:[0,5.5,9.5,13.5,19,22.5,26][i]}));
  const cues = buildVoiceCues(raw, 30, 0);
  assert.ok(cues[0].slotSeconds >= 5.3);
  assert.equal(cues.length, 7);
});
