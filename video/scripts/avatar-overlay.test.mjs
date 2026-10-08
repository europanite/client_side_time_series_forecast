import { test } from 'node:test';
import assert from 'node:assert/strict';
import { avatarCompositeArgs, assertAvatarOutputDuration } from './avatar-composite.mjs';
test('avatar goes bottom-right above caption bar and keeps original audio',()=>{
  const s=avatarCompositeArgs('main.mp4','avatar.webm','out.mp4').join(' ');
  assert.match(s,/overlay=W-w-12:H-h-84/);
  assert.match(s,/-map 0:a\?/);
  assert.match(s,/-frames:v 900/);
  assert.match(s,/colorkey=0x00ff00/);
  assert.ok(s.indexOf('colorkey=0x00ff00') < s.indexOf('scale=320:400'), 'Key green BEFORE resizing to avoid green fringes');
});

test('avatar MP4 accepts the 30-second timeline and detects invalid durations', () => {
  assert.doesNotThrow(() => assertAvatarOutputDuration(30));
  assert.doesNotThrow(() => assertAvatarOutputDuration(30.03));
  assert.throws(() => assertAvatarOutputDuration(31), /instead of 30s/);
  assert.throws(() => assertAvatarOutputDuration(NaN), /instead of 30s/);
});
