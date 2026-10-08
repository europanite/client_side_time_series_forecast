import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SPEECH_BY_CAPTION } from './narration.mjs';

const capture = readFileSync(new URL('./capture-continuous.mjs', import.meta.url), 'utf8');
const svg = readFileSync(new URL('../avatar/forecast-site-qr.svg', import.meta.url), 'utf8');

test('real UI remains visible; a permanent panel displays product name, URL and QR graphic', () => {
  assert.match(capture, /Forecast sales, stock prices, and more/);
  assert.match(capture, /client_side_time_series_forecast/);
  assert.match(capture, /forecast-site-qr\.svg/);
  assert.match(capture, /europanite\.github\.io\/client_side_time_series_forecast/);
  assert.match(capture, /img\.decode\(\)/);
  assert.match(capture, /__demo_brand/);
  assert.doesNotMatch(capture, /__demo_intro|__demo_outro/);
  assert.match(svg, /<svg /);
  assert.match(svg, /fill="white"/);
  assert.match(svg, /id="qr-path"/);
});

test('seven captions include spoken project name and local speech', () => {
  assert.equal(Object.keys(SPEECH_BY_CAPTION).length, 7);
  assert.match(SPEECH_BY_CAPTION['client_side_time_series_forecast'], /Client side/);
  assert.match(SPEECH_BY_CAPTION['Forecast sales, stock prices, and more.'], /stock prices/);
  assert.match(SPEECH_BY_CAPTION['NO DATA UPLOAD. Scan to try it free.'], /No data upload/);
});
