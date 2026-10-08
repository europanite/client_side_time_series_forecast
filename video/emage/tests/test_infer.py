import importlib.util
from pathlib import Path
import sys
import tempfile
import unittest
import wave

SPEC = importlib.util.spec_from_file_location('run_inference', Path(__file__).resolve().parents[1] / 'run_inference.py')
mod = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(mod)


class InferenceSetupTests(unittest.TestCase):
    def test_duration_and_expected_frames(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / 'narration.wav'
            with wave.open(str(path), 'wb') as wav:
                wav.setnchannels(1)
                wav.setsampwidth(2)
                wav.setframerate(16000)
                wav.writeframes(b'\0\0' * (16000 * 40))
            self.assertEqual(mod.output_frames(mod.audio_duration(path)), 1200)
            self.assertEqual(len(mod.audio_fingerprint(path)), 64)

    def test_rejects_missing_audio(self):
        with self.assertRaises(FileNotFoundError):
            mod.audio_fingerprint(Path('/nonexistent.wav'))

    def test_upsample_native_15_fps_motion(self):
        import numpy as np
        source = np.linspace(0.0, 1.0, 600, dtype=np.float32).reshape(-1, 1)
        final = mod.resample_frames(source, 1200)
        self.assertEqual(final.shape, (1200, 1))
        self.assertAlmostEqual(float(final[0, 0]), 0.0)
        self.assertAlmostEqual(float(final[-1, 0]), 1.0)

    def test_rejects_unexpected_lengths(self):
        with self.assertRaises(ValueError):
            mod.output_frames(1)
        with self.assertRaises(ValueError):
            mod.output_frames(150)


if __name__ == '__main__':
    unittest.main()
