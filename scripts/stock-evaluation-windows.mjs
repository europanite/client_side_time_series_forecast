/** Fixed default trading-session counts for the daily stock backtest.
 * Recent sessions form a subset of the long evaluation period.
 */
export const DEFAULT_EVALUATION_WINDOWS = Object.freeze({
  window: 256,
  long: 256,
  recent: 32,
});
