/** User-facing, nontechnical captions. Screenshots always show the real application UI. */
export const SCENES = Object.freeze([
  { id: '01-open', caption: 'Forecast your numbers in a browser.' },
  { id: '02-upload', caption: 'Add a CSV file.' },
  { id: '03-target', caption: 'Choose what to predict.' },
  { id: '04-trained', caption: 'Train XGBoost using past data.' },
  { id: '05-predicted', caption: 'See the next 16 predicted values.' },
  { id: '06-private', caption: 'No server. Your data stays here.' },
]);

export const FRAME_RATE = 30;
export const VIDEO_SECONDS = 40;
export const STILLS_SECONDS = 30;
export const OPENING_SILENCE_SECONDS = 1.8;
export const FRAME_SIZE = Object.freeze({ width: 1280, height: 720 });

/** Legacy screenshot mode: six 5.5-second scenes, a 30-second trim. */
export const CLIP_SECONDS = 5.5;
export const FADE_SECONDS = 0.5;

export function checkTimeline(scenes = SCENES) {
  if (scenes.length !== 6) throw new Error('The demo needs exactly six scenes');
  if (scenes.some((scene) => !scene.id || !scene.caption)) {
    throw new Error('Every scene needs an id and a caption');
  }
  // 6*5.5 - 5*0.5 == 30.5, with 0.5 seconds trimmed to 30.0.
  const compositeSeconds = scenes.length * CLIP_SECONDS - (scenes.length - 1) * FADE_SECONDS;
  if (compositeSeconds < STILLS_SECONDS || compositeSeconds - STILLS_SECONDS > 1) {
    throw new Error(`Bad video timing: ${compositeSeconds} seconds`);
  }
}
