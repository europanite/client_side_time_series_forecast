/**
 * Continuous Playwright recording of the actual app, including pointer movement.
 * Unlike capture.mjs, this records every browser frame rather than screenshots.
 * It fails closed if the real training/forecast steps do not succeed.
 */
import { chromium } from 'playwright';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { renderContinuous } from './render-continuous.mjs';
import { addNarrationToVideo } from './narration.mjs';
import { overlayTalkingAvatar } from './avatar-overlay.mjs';
import { verifyModelChoices } from './model-choices.mjs';
import { AD_SCRIPT } from './ad-script.mjs';
import { FRAME_SIZE, VIDEO_SECONDS } from './timeline.mjs';
import { videoPaths, archiveLegacyFiles } from './video-paths.mjs';

const APP_URL = process.env.APP_URL || 'https://europanite.github.io/client_side_time_series_forecast/';
const INPUT_CSV = resolve(process.env.INPUT_CSV || 'data/sample_data.csv');
const OUTPUT_DIR = resolve(process.env.OUTPUT_DIR || 'video/output');
const TARGET_COLUMN = process.env.TARGET_COLUMN || 'ITEM_A';
const paths = videoPaths(OUTPUT_DIR);
const VIDEO_FILE = paths.finalVideo;
const RAW_FILE = paths.browserRecording;
const EVIDENCE_FILE = paths.evidence;
const FAILED_SHOT = paths.captureFailure;
const VOICE_WAV = paths.narration;
const AVATAR_RAW = paths.avatarRecording;
const AVATAR_PREVIEW = paths.avatarPreview;
const FINAL_PREVIEW = paths.finalPreview;
const NO_AVATAR_FALLBACK = paths.narratedFallback;
const PRODUCT_URL = 'https://europanite.github.io/client_side_time_series_forecast/';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function openApp(page) {
  let lastError;
  for (let attempt = 1; attempt <= 30; attempt++) {
    try {
      const response = await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
      if (!response?.ok()) throw new Error(`HTTP ${response?.status() ?? 'unknown'}`);
      await page.getByText('Client-Side Time-Series Forecast', { exact: true }).first().waitFor({ timeout: 12000 });
      return;
    } catch (error) {
      lastError = error;
      console.log(`Waiting for the real UI (${attempt}/30): ${error.message}`);
      await sleep(1200);
    }
  }
  throw new Error(`Cannot load real UI: ${lastError?.message}`);
}

async function waitForStatus(page, regex, timeout = 120000) {
  const locator = page.getByText(regex).first();
  await locator.waitFor({ state: 'visible', timeout });
  const text = await locator.innerText();
  if (/error:/i.test(text)) throw new Error(`Application reported an error: ${text}`);
  return text;
}

async function addRecordingOverlay(page) {
  const qr = readFileSync(new URL('../avatar/forecast-site-qr.svg', import.meta.url), 'utf8');
  const qrUri = `data:image/svg+xml;base64,${Buffer.from(qr).toString('base64')}`;
  // Captured video includes the *real page*. These two non-interactive layers
  // simply display explanatory captions and the real Playwright pointer position.
  await page.evaluate(({qrUri, url}) => {
    // Persistent, small branding panel; the real application remains visible at all times.
    const brand = document.createElement('aside');
    brand.id = '__demo_brand';
    Object.assign(brand.style, {
      position: 'fixed', top: '12px', right: '12px', width: '270px',
      background: 'rgba(8, 18, 36, .89)', color: '#fff',
      boxShadow: '0 4px 22px rgba(0, 0, 0, .5)', borderRadius: '13px',
      padding: '10px 8px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
      fontFamily: 'system-ui,sans-serif', textAlign: 'center',
      pointerEvents: 'none', zIndex: '2147483643',
    });
    const name = document.createElement('strong');
    name.textContent = 'client_side_time_series_forecast';
    Object.assign(name.style, {
      fontSize: '12px', lineHeight: '1.2', whiteSpace: 'nowrap',
      overflowWrap: 'normal', letterSpacing: '-0.2px',
    });
    const qr = document.createElement('img');
    qr.src = qrUri;
    qr.alt = 'QR code for the forecasting app';
    Object.assign(qr.style, {
      width: '170px', height: '170px', background: '#000000',
      padding: '13px', borderRadius: '7px', boxSizing: 'border-box',
    });
    const address = document.createElement('span');
    address.textContent = url;
    Object.assign(address.style, {
      color: '#bfdbfe', fontSize: '11px', lineHeight: '1.3',
      overflowWrap: 'anywhere',
    });
    brand.append(name, qr, address);
    document.body.appendChild(brand);
    const caption = document.createElement('div');
    caption.id = '__demo_caption';
    Object.assign(caption.style, {
      position: 'fixed', bottom: '0', left: '0', right: '0', height: '84px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,.86)', color: '#ffffff', zIndex: '2147483646',
      font: '700 29px/1.2 system-ui, sans-serif', textAlign: 'center',
      pointerEvents: 'none', letterSpacing: '.1px',
    });
    document.body.appendChild(caption);

    // Informational labels come from the *real* model select's <option>s.
    // The native select popup may not appear in a headless browser recording,
    // so reveal its verified option labels as a temporary, non-interactive strip.
    const models = document.createElement('div');
    models.id = '__demo_models';
    Object.assign(models.style, {
      position: 'fixed', bottom: '96px', left: '50%', transform: 'translateX(-50%)',
      width: 'calc(100% - 96px)', boxSizing: 'border-box',
      display: 'none', alignItems: 'center', justifyContent: 'center',
      gap: '10px', padding: '12px', borderRadius: '14px',
      background: 'rgba(8, 15, 27, .94)', color: '#fff',
      zIndex: '2147483645', pointerEvents: 'none',
      boxShadow: '0 4px 24px rgba(0,0,0,.5)',
      font: '600 19px system-ui, sans-serif',
    });
    document.body.appendChild(models);

    const cursor = document.createElement('div');
    cursor.id = '__demo_cursor';
    Object.assign(cursor.style, {
      position: 'fixed', left: '-50px', top: '-50px', width: '22px', height: '22px',
      border: '3px solid white', borderRadius: '100%', background: 'rgba(38,132,255,.3)',
      boxShadow: '0 0 0 2px rgba(0,0,0,.7)', pointerEvents: 'none',
      zIndex: '2147483647', transform: 'translate(-50%,-50%)',
    });
    document.body.appendChild(cursor);
    document.addEventListener('pointermove', (event) => {
      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;
    }, { passive: true });
    document.addEventListener('pointerdown', () => {
      cursor.style.background = 'rgba(255,199,36,.85)';
      cursor.style.width = '28px';
      cursor.style.height = '28px';
    });
    document.addEventListener('pointerup', () => {
      cursor.style.background = 'rgba(38,132,255,.3)';
      cursor.style.width = '22px';
      cursor.style.height = '22px';
    });
  }, {qrUri, url: PRODUCT_URL});
}

async function caption(page, text) {
  await page.locator('#__demo_caption').evaluate((node, {value, opening, purpose, models, closing}) => {
    node.textContent = value;
    // Large opening product-name caption, then regular short explanatory captions.
    const title = value === opening;
    const highlight = title || value === purpose || value === closing || value === models;
    node.style.color = highlight ? '#a7f3d0' : '#ffffff';
    node.style.fontSize = title ? '35px' : (highlight ? '31px' : '29px');
    const panel = document.getElementById('__demo_models');
    if (panel && value !== models) panel.style.display = 'none';
  }, {value: text, opening: AD_SCRIPT[0], purpose: AD_SCRIPT[1],
    models: AD_SCRIPT[3], closing: AD_SCRIPT[6]});
}

async function showModelChoices(page, options) {
  await page.locator('#__demo_models').evaluate((panel, choices) => {
    panel.replaceChildren();
    for (const { value, label } of choices) {
      const chip = document.createElement('div');
      chip.dataset.choice = value;
      chip.textContent = label;
      Object.assign(chip.style, {
        background: '#1f2937', border: '2px solid #475569',
        borderRadius: '12px', padding: '13px 12px',
        textAlign: 'center', whiteSpace: 'nowrap', flex: '1 1 0',
        transition: 'background .15s, border-color .15s',
      });
      panel.appendChild(chip);
    }
    panel.style.display = 'flex';
  }, options);
}

async function highlightModelChoice(page, value) {
  await page.locator('#__demo_models').evaluate((panel, selected) => {
    for (const chip of panel.children) {
      const active = chip.dataset.choice === selected;
      chip.style.borderColor = active ? '#34d399' : '#475569';
      chip.style.background = active ? '#065f46' : '#1f2937';
    }
  }, value);
}

async function aimAt(page, locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Cannot aim at a control that is not visible');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 28 });
  await page.waitForTimeout(300);
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  mkdirSync(paths.intermediate, { recursive: true });
  const moved = archiveLegacyFiles(OUTPUT_DIR);
  if (moved) console.log(`Archived ${moved} previous debug files to intermediate/legacy/`);
  if (!existsSync(INPUT_CSV)) throw new Error(`Missing CSV: ${INPUT_CSV}`);
  if (process.env.VIDEO_AVATAR_ENABLED === '1' && process.env.VIDEO_VOICE_ENABLED === '0') {
    throw new Error('A talking avatar needs Piper narration: set VIDEO_VOICE_ENABLED=1 (or VIDEO_AVATAR_ENABLED=0)');
  }
  for (const file of [VIDEO_FILE, RAW_FILE, EVIDENCE_FILE, FAILED_SHOT, VOICE_WAV, AVATAR_RAW, AVATAR_PREVIEW, FINAL_PREVIEW, NO_AVATAR_FALLBACK]) rmSync(file, { force: true });
  const workdir = mkdtempSync(join(tmpdir(), 'xgboost-continuous-'));
  let browser, context, page, video;
  const pageErrors = [];
  const phases = [];
  const captionEvents = [];
  let verifiedChoices = [];
  try {
    browser = await chromium.launch({ headless: true, args: ['--disable-dev-shm-usage', '--no-sandbox'] });

    // Avoid recording a long, blank wait while Vite is starting up.
    const probeContext = await browser.newContext({ viewport: FRAME_SIZE });
    try {
      const probe = await probeContext.newPage();
      await openApp(probe);
      await waitForStatus(probe, /Status: (sample )?data loaded/i, 45000);
    } finally {
      await probeContext.close();
    }

    context = await browser.newContext({
      viewport: FRAME_SIZE, deviceScaleFactor: 1, colorScheme: 'dark',
      reducedMotion: 'no-preference',
      recordVideo: { dir: workdir, size: FRAME_SIZE },
    });
    const recordingBegins = performance.now();
    page = await context.newPage();
    video = page.video();
    page.on('pageerror', (error) => { pageErrors.push(error.message); });
    await openApp(page);
    await waitForStatus(page, /Status: (sample )?data loaded/i, 45000);
    if (await page.locator('canvas').count() === 0) throw new Error('Actual chart canvas is missing');
    await addRecordingOverlay(page);
    // Fail early rather than publishing a video with a missing QR image.
    await page.locator('#__demo_brand img').evaluate((img) => img.decode());
    const started = performance.now();
    const leadInSeconds = (started - recordingBegins) / 1000;
    const showCaption = async (words) => {
      await caption(page, words);
      captionEvents.push({ text: words, elapsedSeconds: Number(((performance.now() - started) / 1000).toFixed(3)) });
    };
    const mark = (id) => {
      const elapsed = Number(((performance.now() - started) / 1000).toFixed(3));
      phases.push({ id, elapsedSeconds: elapsed });
      console.log(`Recorded UI step: ${id} (${elapsed}s)`);
    };
    const holdUntil = async (seconds) => {
      const ms = seconds * 1000 - (performance.now() - started);
      if (ms > 0) await page.waitForTimeout(ms);
    };

    await showCaption(AD_SCRIPT[0]);
    mark('open');
    await holdUntil(5.5);

    await showCaption(AD_SCRIPT[1]);
    mark('purpose');
    await holdUntil(9.5);

    await showCaption(AD_SCRIPT[2]);
    const fileInput = page.locator('input[type="file"]').first();
    await aimAt(page, fileInput);
    await fileInput.setInputFiles({
      name: basename(INPUT_CSV), mimeType: 'text/csv', buffer: readFileSync(INPUT_CSV),
    });
    await waitForStatus(page, /Status: data loaded/i, 60000);
    mark('csv-loaded');
    await holdUntil(13.5);

    await showCaption(AD_SCRIPT[3]);
    const selects = page.locator('select');
    if (await selects.count() < 2) throw new Error('Expected real target and model selectors');
    const target = selects.nth(0);
    const model = selects.nth(1);
    await aimAt(page, target);
    // Briefly change the target when another column is available, so the
    // selector change can be seen rather than only changing it invisibly.
    const values = await target.locator('option').evaluateAll((options) =>
      options.map(o => o.value).filter(Boolean));
    const alternate = values.find(v => v !== TARGET_COLUMN);
    if (alternate) {
      await target.selectOption({ value: alternate });
      await page.waitForTimeout(650);
    }
    await target.selectOption({ value: TARGET_COLUMN });
    // Read and verify actual model options before mentioning them in the video.
    verifiedChoices = verifyModelChoices(await model.locator('option').evaluateAll(
      options => options.map(option => ({ value: option.value, label: option.textContent }))
    ));
    await showModelChoices(page, verifiedChoices);
    await aimAt(page, model);
    await highlightModelChoice(page, 'xgboost');
    // Walk through all four selectable modes; ONLY XGBoost is trained below.
    for (const value of ['lightgbm', 'varma', 'chronos', 'xgboost']) {
      await model.selectOption({ value });
      if (await model.inputValue() !== value) {
        throw new Error(`Model selection failed: ${value}`);
      }
      await highlightModelChoice(page, value);
      await page.waitForTimeout(850);
    }
    if (await target.inputValue() !== TARGET_COLUMN || await model.inputValue() !== 'xgboost') {
      throw new Error('Target / XGBoost selection did not take effect');
    }
    mark('four-models-shown-xgboost-selected');
    await holdUntil(19.0);

    await showCaption(AD_SCRIPT[4]);
    const train = page.getByText('Train', { exact: true }).first();
    await aimAt(page, train);
    await train.click({ timeout: 15000 });
    await waitForStatus(page, /Status: xgboost trained/i, 180000);
    mark('trained');
    await holdUntil(22.5);

    await showCaption(AD_SCRIPT[5]);
    const predict = page.getByText(/^Forecast \+16$/).first();
    await aimAt(page, predict);
    await predict.click({ timeout: 15000 });
    await waitForStatus(page, /Status: predicted 16 steps/i, 90000);
    await page.getByText(new RegExp(`Model="xgboost" Target="${TARGET_COLUMN}"`)).first().waitFor({ timeout: 15000 });
    if (await page.locator('canvas').count() === 0) throw new Error('Forecast chart was not rendered');
    mark('predicted-16');
    await holdUntil(26.0);

    await showCaption(AD_SCRIPT[6]);
    mark('privacy');
    await page.mouse.move(1200, 610, { steps: 28 });
    await holdUntil(VIDEO_SECONDS);
    // Always show the actual completed prediction for a moment.
    await page.waitForTimeout(500);

    // Playwright flushes the continuous video ONLY when the context is closed.
    await context.close();
    context = null;
    await video.saveAs(RAW_FILE);
    console.log(`Real continuous Playwright video: ${RAW_FILE}`);
    await browser.close();
    browser = null;

    // Discard setup frames recorded before URL/QR were on the real UI.
    const result = await renderContinuous(RAW_FILE, VIDEO_FILE, leadInSeconds);
    const narration = process.env.VIDEO_VOICE_ENABLED === '0'
      ? { enabled: false }
      : await addNarrationToVideo(VIDEO_FILE, captionEvents, result.contentSeconds, 0, OUTPUT_DIR);
    // Preserve the narrated, verified browser recording even if VRM rendering fails.
    // An avatar-stage failure must not destroy a successful XGBoost demo and voice-over.
    if (process.env.VIDEO_AVATAR_ENABLED === '1') {
      copyFileSync(VIDEO_FILE, NO_AVATAR_FALLBACK);
      console.log(`Narrated fallback saved: ${NO_AVATAR_FALLBACK}`);
    }
    const avatar = process.env.VIDEO_AVATAR_ENABLED === '1'
      ? await overlayTalkingAvatar(VIDEO_FILE, VOICE_WAV, OUTPUT_DIR)
      : { enabled: false };
    writeFileSync(EVIDENCE_FILE, JSON.stringify({
      appUrl: APP_URL, capture: 'Playwright continuous browser recording',
      rawVideo: basename(RAW_FILE), outputVideo: basename(VIDEO_FILE),
      inputCsv: basename(INPUT_CSV), target: TARGET_COLUMN, model: 'xgboost',
      trained: true, forecastSteps: 16, outputSeconds: VIDEO_SECONDS,
      rawSeconds: result.rawSeconds, introTrimSeconds: leadInSeconds,
      contentSeconds: result.contentSeconds, playbackSpeed: result.playbackSpeed,
      phases, captions: captionEvents, modelOptionsVerified: verifiedChoices,
      modelsDemonstratedAsSelectable: verifiedChoices.map(({value}) => value),
      modelsActuallyTrained: ['xgboost'], leadInSeconds, narration, avatar, pageErrors,
      landingPage: PRODUCT_URL, qrCode: 'video/avatar/forecast-site-qr.svg',
    }, null, 2) + '\n');
    console.log(`SUCCESS: ${VIDEO_FILE}`);
  } catch (error) {
    if (page && !page.isClosed()) {
      try { await page.screenshot({ path: FAILED_SHOT }); } catch { /* best effort */ }
    }
    rmSync(VIDEO_FILE, { force: true });
    rmSync(EVIDENCE_FILE, { force: true });
    if (existsSync(NO_AVATAR_FALLBACK)) {
      console.error(`Avatar processing failed. Your complete spoken demo was preserved at: ${NO_AVATAR_FALLBACK}`);
    }
    // Keep WAV and avatar debugging artifacts for inspection.
    throw error;
  } finally {
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
    rmSync(workdir, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(`CONTINUOUS VIDEO FAILED: ${error.stack || error}`);
  process.exitCode = 1;
});
