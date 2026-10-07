// Shared application-level forecast horizon.
//
// Chronos-2 uses 16-point patches, so 16 is the common horizon used by the
// browser UI and by the default XGBoost / VARMA forecast APIs.
export const DEFAULT_FORECAST_HORIZON = 16;
