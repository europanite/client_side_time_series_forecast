/** Model labels are read from the real React <select>, never fabricated for the video. */
export const REQUIRED_MODEL_CHOICES = Object.freeze([
  { value: 'xgboost', label: 'XGBoost' },
  { value: 'lightgbm', label: 'LightGBM' },
  { value: 'varma', label: 'VARMA experimental' },
  { value: 'chronos', label: 'Chronos-2 pretrained' },
]);

/** Reject drift between the recording script and the application's actual UI. */
export function verifyModelChoices(domOptions) {
  if (!Array.isArray(domOptions)) throw new Error('Expected a list of model <option>s');
  const byValue = new Map(domOptions.map(({ value, label }) => [value, label?.trim()]));
  return REQUIRED_MODEL_CHOICES.map(({ value, label }) => {
    if (byValue.get(value) !== label) {
      throw new Error(`Model choice ${value} missing or renamed (expected ${JSON.stringify(label)}, got ${JSON.stringify(byValue.get(value))})`);
    }
    return { value, label: byValue.get(value) };
  });
}
