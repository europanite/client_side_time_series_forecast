import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildFfmpegArgs } from './render.mjs';

test('FFmpeg command assembles six real captures into a 30-second MP4', () => {
  const dir = mkdtempSync(join(tmpdir(), 'video-args-test-'));
  try {
    const shots = Array.from({ length: 6 }, (_, i) => {
      const path = join(dir, `${i}.png`);
      writeFileSync(path, 'screenshot');
      return path;
    });
    const args = buildFfmpegArgs(shots, join(dir, 'out.mp4'));
    assert.equal(args[args.indexOf('-t') + 1], '5.5');
    assert.equal(args[args.lastIndexOf('-t') + 1], '30');
    assert.match(args[args.indexOf('-filter_complex') + 1], /offset=25\[end\]/);
    assert.equal((args[args.indexOf('-filter_complex') + 1].match(/xfade=/g) || []).length, 5);
    assert.equal((args[args.indexOf('-filter_complex') + 1].match(/drawtext=/g) || []).length, 6);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
