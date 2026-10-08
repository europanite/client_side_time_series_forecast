# Playwright browser and npm package versions MUST match.
FROM mcr.microsoft.com/playwright:v1.55.1-noble

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg fonts-dejavu-core python3 python3-venv \
    && rm -rf /var/lib/apt/lists/*

# CPU-only local neural TTS; one shared voice-model cache survives container rebuilds.
RUN python3 -m venv /opt/piper-venv && \
    /opt/piper-venv/bin/pip install --no-cache-dir piper-tts==1.8.0
ENV PATH="/opt/piper-venv/bin:${PATH}"

WORKDIR /video
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY scripts ./scripts

CMD ["node", "scripts/run.mjs"]
