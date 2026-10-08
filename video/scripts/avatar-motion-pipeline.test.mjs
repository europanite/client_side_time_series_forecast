import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const capture = readFileSync(new URL('./capture-continuous.mjs', import.meta.url), 'utf8');
const overlay = readFileSync(new URL('./avatar-overlay.mjs', import.meta.url), 'utf8');
const renderer = readFileSync(new URL('../avatar/main.js', import.meta.url), 'utf8');

test('actual narration cue timings reach the avatar recorder', () => {
  assert.match(capture, /overlayTalkingAvatar\(VIDEO_FILE, VOICE_WAV, OUTPUT_DIR, narration\.cues\)/);
  assert.match(overlay, /window\.__recordAvatar\(wave, duration, cues\)/);
  assert.match(renderer, /validateMotionCues\(cues, duration\)/);
  assert.match(renderer, /sampleAvatarMotion\(elapsed, motionCues, voice\)/);
});

test('new gestures replace per-frame static arm poses without altering green-screen geometry', () => {
  assert.doesNotMatch(renderer, /applyRelaxedArmPose\(/);
  assert.match(renderer, /applyMotion\(model, pose\)/);
  assert.match(renderer, /renderer\.setClearColor\(0x00ff00, 1\)/);
});

// Playwright serializes the evaluate callback and executes it in the page,
// where Node's local variables are NOT in scope. Exercise that callback with
// an isolated page-like global to catch missing destructured arguments.
test('avatar recording callback receives duration inside the browser context', () => {
  const match = overlay.match(/page\.evaluate\((\(\{[^}]+\}\)\s*=>\s*window\.__recordAvatar\([^)]*\)),\s*\{wave:levels,\s*duration:\s*VIDEO_SECONDS,\s*cues\}\)/);
  assert.ok(match, 'Expected a direct Playwright avatar-recording callback');
  const wave = [0, 0.2];
  const cues = [{startSeconds: 1.8, speech: 'Hello'}];
  const window = {__recordAvatar: (w, seconds, markers) => ({wave: w, duration: seconds, cues: markers})};
  const browserCallback = runInNewContext(`(${match[1]})`, {window});
  const result = browserCallback({wave, duration: 40, cues});
  assert.deepEqual(JSON.parse(JSON.stringify(result)), {wave, duration: 40, cues});
});
