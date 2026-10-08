import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleAvatarMotion, validateMotionCues, SCENE_GESTURES } from './motion.mjs';

const starts = [1.8, 6.5, 11.0, 15.0, 21.8, 25.5, 29.4, 35.8];
const cues = starts.map(startSeconds => ({startSeconds}));

test('rejects missing, reversed, or out-of-range speech cues', () => {
  assert.deepEqual(validateMotionCues(cues), starts);
  assert.throws(() => validateMotionCues(cues.slice(1)), /eight/);
  assert.throws(() => validateMotionCues(cues.map(c => ({...c,startSeconds:90}))), /ascending/);
  assert.throws(() => validateMotionCues(cues.map((c, i) => i === 3 ? {startSeconds:9} : c)), /ascending/);
});

test('the eight scenes vary the pose substantially, while retaining a relaxed base', () => {
  assert.equal(SCENE_GESTURES.length, 8);
  const idle = sampleAvatarMotion(7, null, 0);
  const explanation = sampleAvatarMotion(8.1, starts, 0.5);
  assert.ok(idle.bones.rightUpperArm[2] > 1.15);
  assert.ok(explanation.bones.rightUpperArm[2] < idle.bones.rightUpperArm[2] - 0.25);
  const results = sampleAvatarMotion(27, starts, 0.5);
  assert.ok(results.bones.head[1] > 0.065, 'the avatar glances toward the data');
  const qr = sampleAvatarMotion(37.5, starts, 0.5);
  assert.ok(qr.bones.rightUpperArm[2] < 0.85, 'the avatar gestures toward the QR code');
});

test('poses ease smoothly across all eight scene boundaries', () => {
  for (const boundary of starts.slice(1)) {
    const a = sampleAvatarMotion(boundary - 0.015, starts, 0.4);
    const b = sampleAvatarMotion(boundary + 0.015, starts, 0.4);
    for (const bone of Object.keys(a.bones)) {
      for (let i = 0; i < 3; i++) {
        assert.ok(Math.abs(a.bones[bone][i] - b.bones[bone][i]) < 0.04,
          `${bone} jumps at ${boundary}s`);
      }
    }
  }
});

test('eye blinks are spaced irregularly; mouth energy does not randomize pose', () => {
  assert.ok(sampleAvatarMotion(1.84, starts).blink > 0.95);
  assert.equal(sampleAvatarMotion(2.6, starts).blink, 0);
  assert.deepEqual(sampleAvatarMotion(7, starts, 0.25), sampleAvatarMotion(7, starts, 0.25));
  const quiet = sampleAvatarMotion(7, starts, 0);
  const speaking = sampleAvatarMotion(7, starts, 1);
  assert.ok(speaking.bones.head[0] > quiet.bones.head[0]);
});
