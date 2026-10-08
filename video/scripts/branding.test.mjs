import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SPEECH_BY_CAPTION } from './narration.mjs';
import { AD_SCRIPT } from './ad-script.mjs';

const capture = readFileSync(new URL('./capture-continuous.mjs', import.meta.url), 'utf8');
const svg = readFileSync(new URL('../avatar/forecast-site-qr.svg', import.meta.url), 'utf8');

test('real UI remains visible; a permanent panel displays product name, URL and QR graphic', () => {
  assert.match(capture, /AD_SCRIPT\[1\]/);
  assert.match(capture, /client_side_time_series_forecast/);
  assert.match(capture, /forecast-site-qr\.svg/);
  assert.match(capture, /europanite\.github\.io\/client_side_time_series_forecast/);
  assert.match(capture, /address\.textContent = url;/);
  assert.doesNotMatch(capture, /address\.textContent = url\.replace/);
  assert.match(capture, /img\.decode\(\)/);
  assert.match(capture, /__demo_brand/);
  assert.doesNotMatch(capture, /__demo_intro|__demo_outro/);
  assert.match(svg, /<svg /);
  // Keep the QR's white quiet zone for camera compatibility, with a black surrounding frame.
  assert.match(svg, /<rect[^>]*fill="white"/);
  assert.match(svg, /id="qr-path" fill="#000000"/);
  assert.match(capture, /width: '270px'/);
  assert.match(capture, /whiteSpace: 'nowrap'/);
  assert.match(capture, /background: '#000000'/);
  assert.match(capture, /padding: '13px'/);
});

test('eight captions are exactly the eight spoken advertising lines', () => {
  assert.equal(AD_SCRIPT.length, 8);
  assert.equal(Object.keys(SPEECH_BY_CAPTION).length, 8);
  AD_SCRIPT.forEach((line, i) => {
    assert.equal(SPEECH_BY_CAPTION[line], line);
    assert.ok(capture.includes(`showCaption(AD_SCRIPT[${i}])`));
  });
});
