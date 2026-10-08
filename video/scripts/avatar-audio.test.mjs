import { test } from 'node:test';
import assert from 'node:assert/strict';
import { voiceEnvelope } from './avatar-audio.mjs';

test('silence remains closed for 40 seconds', () => {
  const pcm = Buffer.alloc(24000 * 40 * 2);
  const levels = voiceEnvelope(pcm);
  assert.equal(levels.length, 1200);
  assert.ok(levels.every(x => x === 0));
});
test('speech rises and falls while staying in [0,1]', () => {
  const pcm = Buffer.alloc(24000 * 40 * 2);
  for (let i = 24000; i < 3 * 24000; i++) pcm.writeInt16LE(Math.round(Math.sin(i / 17) * 15000), i * 2);
  const e = voiceEnvelope(pcm);
  assert.ok(e[33] > 0.4);
  assert.ok(e[180] < 0.001);
  assert.ok(e.every(x => x >= 0 && x <= 1));
});
