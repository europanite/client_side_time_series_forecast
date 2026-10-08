import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REQUIRED_MODEL_CHOICES, verifyModelChoices } from './model-choices.mjs';

test('all four model choices are required and preserve the actual UI wording', () => {
  assert.deepEqual(REQUIRED_MODEL_CHOICES.map(item => item.value), ['xgboost', 'lightgbm', 'varma', 'chronos']);
  const actual = [...REQUIRED_MODEL_CHOICES].reverse();
  assert.deepEqual(verifyModelChoices(actual), REQUIRED_MODEL_CHOICES);
});

test('changed model choices fail instead of silently displaying fictitious options', () => {
  assert.throws(() => verifyModelChoices([{value: 'xgboost', label: 'XGBoost'}]), /lightgbm/);
  assert.throws(() => verifyModelChoices(REQUIRED_MODEL_CHOICES.map(o => o.value === 'varma' ? {...o, label: 'VARMA'} : o)), /varma/);
  assert.throws(() => verifyModelChoices(null), /list/);
});
