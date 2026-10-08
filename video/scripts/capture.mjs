import { chromium } from 'playwright';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { render } from './render.mjs';
import { SCENES, FRAME_SIZE, checkTimeline } from './timeline.mjs';

checkTimeline();

const APP_URL = process.env.APP_URL || 'https://europanite.github.io/client_side_time_series_forecast/';
const INPUT_CSV = resolve(process.env.INPUT_CSV || 'data/sample_data.csv');
const OUTPUT_DIR = resolve(process.env.OUTPUT_DIR || 'video/output');
const TARGET_COLUMN = process.env.TARGET_COLUMN || 'ITEM_A';
const outputFile = join(OUTPUT_DIR, 'video_30s.mp4');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function openApp(page) {
  let lastError;
  // Vite can take a short time to become ready after the frontend container starts.
  for (let attempt = 1; attempt <= 30; attempt++) {
    try {
      const response = await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
      if (!response?.ok()) throw new Error(`HTTP ${response?.status() ?? 'unknown'}`);
      await page.getByText('Client-Side Time-Series Forecast', { exact: true }).first().waitFor({ timeout: 12000 });
      return;
    } catch (error) {
      lastError = error;
      console.log(`App not ready (${attempt}/30): ${error.message}`);
      await sleep(1200);
    }
  }
  throw new Error(`Cannot open ${APP_URL}: ${lastError?.message}`);
}

async function statusIs(page, regex, timeout = 120000) {
  await page.getByText(regex).first().waitFor({ state: 'visible', timeout });
  const status = await page.getByText(regex).first().innerText();
  if (/error:/i.test(status)) throw new Error(`Application status error: ${status}`);
}

async function saveShot(page, directory, index) {
  const path = join(directory, `${SCENES[index].id}.png`);
  // Chart.js has an animation; make sure the screenshot shows the finished chart.
  await page.waitForTimeout(1000);
  await page.screenshot({ path, animations: 'disabled', fullPage: false });
  console.log(`Real UI: ${path}`);
  return path;
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  if (!existsSync(INPUT_CSV)) throw new Error(`Missing input CSV: ${INPUT_CSV}`);
  rmSync(outputFile, { force: true });
  const workdir = mkdtempSync(join(tmpdir(), 'xgboost-real-ui-'));
  const evidence = join(OUTPUT_DIR, 'capture-evidence.json');
  const debugPng = join(OUTPUT_DIR, 'capture-failed.png');
  rmSync(evidence, { force: true });
  rmSync(debugPng, { force: true });
  let browser;
  let page;
  const shots = [];
  const errors = [];
  try {
    browser = await chromium.launch({ headless: true, args: ['--disable-dev-shm-usage', '--no-sandbox'] });
    const context = await browser.newContext({ viewport: FRAME_SIZE, deviceScaleFactor: 1, colorScheme: 'dark', reducedMotion: 'reduce' });
    page = await context.newPage();
    page.on('pageerror', (error) => { errors.push(error.message); });

    await openApp(page);
    // Startup already loads a sample CSV, and the source has two startup loaders.
    // Let those settle BEFORE manually uploading the file in the recording.
    await statusIs(page, /Status: (sample )?data loaded/i, 45000);
    await page.waitForTimeout(1200);
    shots.push(await saveShot(page, workdir, 0));

    const fileChooser = page.locator('input[type="file"]').first();
    await fileChooser.setInputFiles({
      name: basename(INPUT_CSV), mimeType: 'text/csv', buffer: readFileSync(INPUT_CSV),
    });
    await statusIs(page, /Status: data loaded/i, 60000);
    shots.push(await saveShot(page, workdir, 1));

    const dropdowns = page.locator('select');
    if (await dropdowns.count() < 2) throw new Error('Expected target and model dropdowns in the real UI');
    await dropdowns.nth(0).selectOption({ value: TARGET_COLUMN });
    await dropdowns.nth(1).selectOption({ value: 'xgboost' });
    if (await dropdowns.nth(0).inputValue() !== TARGET_COLUMN) throw new Error(`Target column ${TARGET_COLUMN} is unavailable`);
    shots.push(await saveShot(page, workdir, 2));

    await page.getByText('Train', { exact: true }).first().click({ timeout: 15000 });
    await statusIs(page, /Status: xgboost trained/i, 180000);
    shots.push(await saveShot(page, workdir, 3));

    await page.getByText(/^Forecast \+16$/).first().click({ timeout: 15000 });
    await statusIs(page, /Status: predicted 16 steps/i, 90000);
    await page.getByText(new RegExp(`Model="xgboost" Target="${TARGET_COLUMN}"`), { exact: false }).first().waitFor({ timeout: 15000 });
    if (await page.locator('canvas').count() === 0) throw new Error('Forecast chart canvas was not rendered');
    shots.push(await saveShot(page, workdir, 4));
    shots.push(await saveShot(page, workdir, 5));

    // Evidence is useful if the user later changes the app and the output breaks.
    writeFileSync(evidence, JSON.stringify({
      appUrl: APP_URL, source: 'Playwright screenshots of actual React UI',
      inputCsv: basename(INPUT_CSV), target: TARGET_COLUMN, model: 'xgboost',
      trained: true, forecastSteps: 16, videoSeconds: 30,
      sceneIds: SCENES.map(s => s.id), pageErrors: errors,
    }, null, 2) + '\n');
    await render(shots, outputFile);
    console.log(`SUCCESS: ${outputFile}`);
  } catch (error) {
    if (page && !page.isClosed()) {
      try { await page.screenshot({ path: debugPng }); } catch { /* best effort */ }
    }
    throw error;
  } finally {
    if (browser) await browser.close();
    rmSync(workdir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(`VIDEO PIPELINE FAILED: ${error.stack || error}`);
  process.exitCode = 1;
});
