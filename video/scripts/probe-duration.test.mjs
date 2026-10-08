import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';
import { durationFromPackets, probeDuration } from './render-continuous.mjs';

const exec = promisify(execFile);

test('packet-duration parser ignores invalid timestamps', () => {
  assert.equal(durationFromPackets([{ pts_time: '0', duration_time: '0.04' },
    { pts_time: '1.96', duration_time: '0.04' }]), 2);
  assert.equal(durationFromPackets([{pts_time:'N/A'}, {pts_time:undefined}]), null);
});

test('live WebM with format duration N/A still has measurable playback length', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'avatar-duration-test-'));
  const input = join(dir, 'live.webm');
  try {
    await exec('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y',
      '-f', 'lavfi', '-i', 'color=c=green:s=160x120:r=10',
      '-t', '2', '-an', '-c:v', 'libvpx', '-deadline', 'realtime',
      '-cpu-used', '8', '-live', '1', input]);
    const {stdout} = await exec('ffprobe', ['-v','error', '-show_entries', 'format=duration',
      '-of','default=noprint_wrappers=1:nokey=1',input]);
    assert.equal(stdout.trim(), 'N/A', 'fixture must reproduce the original failure');
    const duration = await probeDuration(input);
    assert.ok(duration >= 1.9 && duration <= 2.1, `Expected ~2 seconds, got ${duration}`);
  } finally {
    await rm(dir, {recursive:true,force:true});
  }
});
