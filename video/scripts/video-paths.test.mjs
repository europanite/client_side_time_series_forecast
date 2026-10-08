import { test } from 'node:test';
import assert from 'node:assert/strict';
import { videoPaths, archiveLegacyFiles } from './video-paths.mjs';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('publishable outputs stay at the root; intermediate artifacts stay separate', () => {
  const p = videoPaths('/out');
  assert.equal(p.finalVideo, '/out/video.mp4');
  assert.equal(p.finalPreview, '/out/preview.png');
  assert.equal(p.evidence, '/out/evidence.json');
  for (const field of ['browserRecording','narration','narratedFallback','avatarRecording','avatarPreview','captureFailure']) {
    assert.ok(p[field].startsWith('/out/intermediate/'), field);
  }
  assert.equal(new Set(Object.values(p)).size, Object.values(p).length);
});

test('old debug files move into legacy without overwriting existing backups', () => {
  const root = mkdtempSync(join(tmpdir(), 'forecast-video-path-test-'));
  try {
    mkdirSync(join(root, 'intermediate', 'legacy'), {recursive:true});
    writeFileSync(join(root, 'video_narration.wav'), 'new');
    writeFileSync(join(root, 'intermediate', 'legacy', 'video_narration.wav'), 'old');
    assert.equal(archiveLegacyFiles(root), 1);
    assert.equal(readFileSync(join(root, 'intermediate', 'legacy', 'video_narration.wav'), 'utf8'), 'old');
    assert.equal(readFileSync(join(root, 'intermediate', 'legacy', '1-video_narration.wav'), 'utf8'), 'new');
    assert.equal(archiveLegacyFiles(root), 0);
  } finally { rmSync(root, {recursive:true, force:true}); }
});
