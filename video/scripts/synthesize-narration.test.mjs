/** Verify the manifest-to-Piper CLI contract without downloading a voice. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./synthesize-narration.py', import.meta.url));
const pythonAvailable = spawnSync('python3', ['--version']).status === 0;

function setup(dir) {
  const fakePackage = join(dir, 'piper');
  const modelDir = join(dir, 'models');
  const outputDir = join(dir, 'out');
  mkdirSync(fakePackage);
  mkdirSync(modelDir);
  mkdirSync(outputDir);
  writeFileSync(join(fakePackage, '__init__.py'), `
class PiperVoice:
    @staticmethod
    def load(model_path):
        return PiperVoice()
    def synthesize_wav(self, sentence, wav_file):
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(24000)
        wav_file.writeframes(b'\\x00\\x00' * 2400)
`);
  const voice = 'en_US-lessac-medium';
  writeFileSync(join(modelDir, `${voice}.onnx`), 'fake voice model');
  writeFileSync(join(modelDir, `${voice}.onnx.json`), '{}');
  const manifest = join(dir, 'cues.json');
  const run = () => execFileSync('python3', [script, '--manifest', manifest,
    '--output-dir', outputDir, '--model-dir', modelDir, '--voice', voice], {
    encoding: 'utf8', env: {...process.env, PYTHONPATH: dir},
  });
  return {manifest, outputDir, run};
}

test('eight narration cues generate eight WAV clips without network or a real Piper model',
  {skip: !pythonAvailable}, () => {
    const dir = mkdtempSync(join(tmpdir(), 'piper-cues-'));
    try {
      const {manifest, outputDir, run} = setup(dir);
      writeFileSync(manifest, JSON.stringify(Array.from({length: 8}, (_, i) => ({
        caption: `scene${i + 1}`, speech: `Narration ${i + 1}`,
      }))));
      const log = run();
      assert.match(log, /Piper narration 8\/8:/);
      assert.deepEqual(readdirSync(outputDir).sort(),
        Array.from({length: 8}, (_, i) => `narration_0${i}.wav`));
    } finally {
      rmSync(dir, {force: true, recursive: true});
    }
  });


test('narration cue count is not hardcoded to eight', {skip: !pythonAvailable}, () => {
  const dir = mkdtempSync(join(tmpdir(), 'piper-eight-cues-'));
  try {
    const {manifest, outputDir, run} = setup(dir);
    writeFileSync(manifest, JSON.stringify(Array.from({length: 8}, (_, i) => ({speech: `Clip ${i}`}))));
    assert.match(run(), /Piper narration 8\/8:/);
    assert.equal(readdirSync(outputDir).filter(name => name.endsWith('.wav')).length, 8);
  } finally {
    rmSync(dir, {force: true, recursive: true});
  }
});

test('rejects malformed or empty cues before Piper loading', {skip: !pythonAvailable}, () => {
  const dir = mkdtempSync(join(tmpdir(), 'piper-invalid-'));
  try {
    const {manifest, run} = setup(dir);
    for (const cues of [[], {}, [{speech: ''}], [null], [{caption: 'x'}]]) {
      writeFileSync(manifest, JSON.stringify(cues));
      const bad = spawnSync('python3', [script, '--manifest', manifest,
        '--output-dir', join(dir, 'out'), '--model-dir', join(dir, 'models'),
        '--voice', 'en_US-lessac-medium'], {encoding: 'utf8', env: {...process.env, PYTHONPATH: dir}});
      assert.notEqual(bad.status, 0);
      assert.match(bad.stderr, /Narration manifest|Empty or invalid speech/);
    }
  } finally {
    rmSync(dir, {force: true, recursive: true});
  }
});
