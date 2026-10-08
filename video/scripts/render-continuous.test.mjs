import assert from 'node:assert/strict';
import test from 'node:test';
import { buildContinuousFfmpegArgs } from './render-continuous.mjs';

const filterFrom = args => args[args.indexOf('-vf') + 1];

test('continuous output always targets 1200 real frames and 40 seconds', () => {
  for (const rawSeconds of [30.1, 40, 75.25]) {
    const args = buildContinuousFfmpegArgs('capture.webm', 'out.mp4', rawSeconds);
    assert.equal(args[args.indexOf('-frames:v') + 1], '1200');
    assert.equal(args[args.indexOf('-i') + 1], 'capture.webm');
    assert.ok(!args.includes('-loop'), 'must not reintroduce still screenshots');
    assert.match(filterFrom(args), /fps=30/);
    assert.match(filterFrom(args), /trim=duration=40/);
    assert.match(filterFrom(args), /setpts=/);
    assert.match(filterFrom(args), /tpad=stop_mode=clone/);
  }
});

test('bad input video duration is rejected', () => {
  for (const duration of [0, -1, NaN, Infinity]) {
    assert.throws(() => buildContinuousFfmpegArgs('x.webm', 'x.mp4', duration), /positive WebM duration/);
  }
});
