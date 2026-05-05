const HOUR_MS = 60 * 60 * 1000;
const DEFAULT_FRAME_COUNT = 121;

export function buildFallbackTimes(startDate = new Date(), frameCount = DEFAULT_FRAME_COUNT) {
  return Array.from({length: frameCount}, (_, index) => {
    const next = new Date(startDate.getTime() + index * HOUR_MS);
    return next.toISOString().slice(0, 19);
  });
}

export function createEmptySites() {
  return {
    names: [],
    lats: [],
    lons: [],
    risk: [],
    dye: [],
    l10: []
  };
}

export function createEmptyShoreline() {
  return {
    lats: [],
    lons: [],
    risk: []
  };
}

export function createFallbackForecastState() {
  return {
    times: buildFallbackTimes(),
    frameUrls: [],
    bounds: null,
    domain: null,
    thresholds: [-5, -3],
    sites: createEmptySites(),
    shoreline: createEmptyShoreline()
  };
}
