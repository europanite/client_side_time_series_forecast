#!/usr/bin/env python3
"""One local Piper model load generates all six voice clips, without any speech API."""
import argparse
import json
import re
import subprocess
import sys
import wave
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--voice", default="en_US-lessac-medium")
    parser.add_argument("--model-dir", default="/voices")
    args = parser.parse_args()

    if not re.fullmatch(r"[a-zA-Z0-9_-]{1,80}", args.voice):
        parser.error("Voice name must be a Piper voice ID, e.g. en_US-lessac-medium")

    model_dir = Path(args.model_dir)
    output_dir = Path(args.output_dir)
    model_dir.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)
    model_path = model_dir / (args.voice + ".onnx")
    config_path = model_dir / (args.voice + ".onnx.json")
    if not model_path.is_file() or not config_path.is_file():
        print(f"Downloading Piper voice {args.voice} (once, cached at {model_dir})", flush=True)
        subprocess.run([
            sys.executable, "-m", "piper.download_voices",
            "--data-dir", str(model_dir), args.voice,
        ], check=True)

    if not model_path.is_file() or not config_path.is_file():
        raise RuntimeError(f"Piper voice download incomplete: {model_path}")

    from piper import PiperVoice

    voice = PiperVoice.load(str(model_path))
    cues = json.loads(Path(args.manifest).read_text(encoding="utf-8"))
    if len(cues) != 6:
        raise ValueError(f"Expected exactly six narration cues, got {len(cues)}")

    for index, cue in enumerate(cues):
        sentence = cue["speech"]
        if not isinstance(sentence, str) or not sentence.strip():
            raise ValueError(f"Empty speech for cue {index}")
        output_file = output_dir / f"narration_{index:02d}.wav"
        with wave.open(str(output_file), "wb") as wav_file:
            voice.synthesize_wav(sentence, wav_file)
        print(f"Piper narration {index + 1}/6: {sentence}", flush=True)


if __name__ == "__main__":
    main()
