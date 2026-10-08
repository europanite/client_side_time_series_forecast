import test from 'node:test';
import assert from 'node:assert/strict';
import { EMAGE_BONES, EMAGE_FORMAT, EMAGE_LIMITS, validateEmageMotion, sampleEmageMotion } from './emage-motion.mjs';
const fixture = () => ({
  format: EMAGE_FORMAT, fps:30, audioSha256:'0'.repeat(64),
  bones:Object.fromEntries(EMAGE_BONES.map(name => [name,
    Array.from({length:1200}, (_, i) => [i === 0 ? 0 : 0.1, 0, 0])])),
});
test('validates a 40-second EMAGE manifest with per-bone rotation limits', () => {
  const data = fixture();
  assert.equal(validateEmageMotion(data), data);
  data.bones.head[700][1] = Infinity;
  assert.throws(() => validateEmageMotion(data), /head/);
  const data2 = fixture();
  data2.bones.leftUpperArm[12][0] = EMAGE_LIMITS.leftUpperArm * 0.9;
  assert.equal(validateEmageMotion(data2), data2);
});
test('rejects missing frames and fabricated manifest metadata', () => {
  const data = fixture();
  data.bones.spine.pop();
  assert.throws(() => validateEmageMotion(data), /(spine|chest)/);
  const other = fixture(); other.audioSha256 = 'not-a-hash';
  assert.throws(() => validateEmageMotion(other), /manifest/);
});
test('interpolates external motion without changing source arrays', () => {
  const data = fixture();
  assert.ok(Math.abs(sampleEmageMotion(data, 1/60).head[0] - 0.05) < 1e-10);
  assert.equal(data.bones.head[1][0], 0.1);
});
