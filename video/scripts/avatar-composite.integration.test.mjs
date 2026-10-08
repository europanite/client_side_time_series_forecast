/** End-to-end FFmpeg smoke test: raw green source should not cover the UI or erase speech. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { avatarCompositeArgs } from './avatar-composite.mjs';

function ff(...args) {
  return execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    maxBuffer: 1024 * 1024 * 8,
  });
}

const ffmpegPresent = (() => {
  try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true; }
  catch { return false; }
})();

test('green-screen keying preserves the UI and AAC voice track', {skip: !ffmpegPresent}, () => {
  const dir = mkdtempSync(join(tmpdir(), 'avatar-key-test-'));
  try {
    const main = join(dir,'main.mp4');
    const avatar = join(dir,'avatar.webm');
    const output = join(dir,'final.mp4');
    ff('-f','lavfi','-i','color=c=black:s=1280x720:r=30:d=0.7',
       '-f','lavfi','-i','sine=frequency=330:sample_rate=48000:duration=0.7',
       '-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p',
       '-c:a','aac','-shortest',main);
    ff('-f','lavfi','-i','color=c=0x00ff00:s=480x600:r=30:d=0.7',
       '-vf','drawbox=x=150:y=90:w=170:h=410:c=white:t=fill',
       '-c:v','libvpx-vp9','-b:v','500k',avatar);
    execFileSync('ffmpeg', avatarCompositeArgs(main,avatar,output), {
      maxBuffer: 1024 * 1024 * 8,
    });
    const probe = execFileSync('ffprobe', ['-v','error','-show_entries',
      'stream=codec_type,codec_name','-of','csv=p=0',output], {encoding:'utf8'});
    assert.match(probe,/h264,video/);
    assert.match(probe,/aac,audio/);
    // Pixel outside the human silhouette (bottom right) must show background UI black, not green.
    const pixel = ff('-ss','0.3','-i',output,'-vf','crop=2:2:950:240',
      '-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','-');
    assert.equal(pixel.length,12);
    assert.ok(pixel[1] < 80, `Green screen leaked: RGB ${Array.from(pixel.slice(0,3))}`);
  } finally {
    rmSync(dir,{force:true,recursive:true});
  }
});
