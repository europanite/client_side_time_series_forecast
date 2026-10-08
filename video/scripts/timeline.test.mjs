import assert from 'node:assert/strict';
import test from 'node:test';
import { SCENES, VIDEO_SECONDS, STILLS_SECONDS, OPENING_SILENCE_SECONDS, FRAME_RATE, CLIP_SECONDS, FADE_SECONDS, checkTimeline } from './timeline.mjs';

test('40-second continuous timeline; legacy montage stays 30 seconds', () => {
  assert.doesNotThrow(() => checkTimeline());
  assert.equal(VIDEO_SECONDS, 40);
  assert.equal(STILLS_SECONDS, 30);
  assert.equal(OPENING_SILENCE_SECONDS, 1.8);
  assert.equal(FRAME_RATE, 30);
  assert.equal(SCENES.length, 6);
  assert.ok(SCENES.find((s) => s.id === '04-trained'));
  assert.ok(SCENES.find((s) => s.id === '05-predicted'));
  assert.equal(SCENES.length * CLIP_SECONDS - 5 * FADE_SECONDS, 30.5);
});
