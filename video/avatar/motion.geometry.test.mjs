import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleAvatarMotion } from './motion.mjs';

const starts = [1.8, 6.5, 11, 15, 21.8, 25.5, 29.4, 35.8];

// Mirror THREE.Euler's XYZ composition on a vector: R = Rx * Ry * Rz.
// A unit +X (left) or -X (right) is a straight T-pose bone direction.
function rotateXYZ([a,b,c], [x,y,z]) {
  const cz = Math.cos(z), sz = Math.sin(z);
  const az = cz*a - sz*b, bz = sz*a + cz*b;
  const cy = Math.cos(y), sy = Math.sin(y);
  const ay = cy*az + sy*c, cz2 = -sy*az + cy*c;
  const cx = Math.cos(x), sx = Math.sin(x);
  return [ay, cx*bz - sx*cz2, sx*bz + cx*cz2];
}
function armVectors(bones, side) {
  const unit = side === 'left' ? [1,0,0] : [-1,0,0];
  const upper = bones[`${side}UpperArm`];
  const lower = bones[`${side}LowerArm`];
  return {
    elbow: rotateXYZ(unit, upper),
    wrist: rotateXYZ(rotateXYZ(unit, lower), upper),
  };
}

test('VRM 1.0 normalized relaxed arms hang down and bend forward (+Z)', () => {
  const { bones } = sampleAvatarMotion(7, null, 0);
  for (const side of ['left', 'right']) {
    const { elbow, wrist } = armVectors(bones, side);
    assert.ok(elbow[1] < -0.91, `${side} upper arm must point down`);
    assert.ok(wrist[2] > 0.15, `${side} wrist must have a natural forward elbow bend`);
  }
});

test('both arms present the model choices in front of the chest, not straight sideways', () => {
  const { bones } = sampleAvatarMotion(18.2, starts, 0.5);
  const left = armVectors(bones, 'left');
  const right = armVectors(bones, 'right');
  for (const [side, arm] of [['left',left], ['right',right]]) {
    assert.ok(arm.elbow[1] < -0.4, `${side} elbow still hangs below shoulder`);
    assert.ok(arm.elbow[2] > 0.20, `${side} elbow projects forward, +Z`);
    assert.ok(arm.wrist[2] > 0.35, `${side} wrist projects forward, +Z`);
  }
  assert.ok(Math.abs(left.wrist[2] - right.wrist[2]) < 0.08, 'two-handed gesture is symmetric');
});

test('right arm gestures up/outward towards the QR panel rather than twisting backward', () => {
  const rest = armVectors(sampleAvatarMotion(24, null, 0).bones, 'right');
  const qr = armVectors(sampleAvatarMotion(37, starts, 0.5).bones, 'right');
  assert.ok(qr.elbow[1] > rest.elbow[1] + 0.22, 'elbow rises outward during QR cue');
  assert.ok(qr.elbow[2] > 0.15, 'raised arm remains in front of the body');
  assert.ok(qr.wrist[2] > 0.25, 'forearm is forward, not hyperextended');
});
