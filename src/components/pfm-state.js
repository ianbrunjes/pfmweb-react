import {loadForecastAssets} from "./pfm-assets.js";
import {formatDateTime, t} from "./i18n.js";

const HOUR_MS = 60 * 60 * 1000;
const DEFAULT_FRAME_COUNT = 121;
const listeners = new Set();

let currentFrame = 0;
let currentSite = 0;
let initialized = false;
let initializePromise = null;

const state = {
  times: buildFallbackTimes(),
  frameUrls: [],
  bounds: null,
  domain: null,
  thresholds: [-5, -3],
  sites: {
    names: [],
    lats: [],
    lons: [],
    risk: [],
    dye: [],
    l10: []
  },
  shoreline: {
    lats: [],
    lons: [],
    risk: []
  }
};

function buildFallbackTimes() {
  const start = new Date();
  return Array.from({length: DEFAULT_FRAME_COUNT}, (_, index) => {
    const next = new Date(start.getTime() + index * HOUR_MS);
    return next.toISOString().slice(0, 19);
  });
}

function notify() {
  const snapshot = getForecastState();
  for (const listener of listeners) listener(snapshot);
}

function preserveScrollPosition() {
  if (typeof window === "undefined") return null;

  const x = window.scrollX;
  const y = window.scrollY;
  return () => {
    window.scrollTo(x, y);
    window.requestAnimationFrame(() => window.scrollTo(x, y));
  };
}

function normalizeIso(isoString) {
  return isoString.endsWith("Z") ? isoString : `${isoString}Z`;
}

function formatDisplayTime(isoString) {
  return formatDateTime(normalizeIso(isoString), {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "America/Los_Angeles"
  });
}

export function getForecastState() {
  return {
    ...state,
    sites: state.sites,
    shoreline: state.shoreline,
    currentFrame,
    currentSite
  };
}

export function subscribeToForecastState(listener) {
  listeners.add(listener);
  listener(getForecastState());
  return () => listeners.delete(listener);
}

export function getFrameUrl(frameIndex) {
  return state.frameUrls[frameIndex] ?? state.frameUrls[0] ?? "";
}

export function formatForecastTime(frameIndex = currentFrame) {
  return formatDisplayTime(state.times[frameIndex] ?? state.times[0]);
}

export function formatUpdatedTime() {
  const first = state.times[0];
  return first ? t("updated", {time: formatDisplayTime(first)}) : t("forecastTimeUnavailable");
}

export function getFrameCount() {
  return state.times.length;
}

export function setCurrentFrame(nextFrame) {
  const max = Math.max(0, state.times.length - 1);
  const frame = Math.max(0, Math.min(max, Number(nextFrame)));
  if (frame === currentFrame) return;

  const restoreScroll = preserveScrollPosition();
  currentFrame = frame;
  notify();
  restoreScroll?.();
}

export function setCurrentSite(nextSite) {
  const max = Math.max(0, state.sites.names.length - 1);
  const site = Math.max(0, Math.min(max, Number(nextSite)));
  if (site === currentSite) return;

  const restoreScroll = preserveScrollPosition();
  currentSite = site;
  notify();
  restoreScroll?.();
}

export async function initializeForecastState() {
  if (initialized) return getForecastState();
  if (initializePromise) return initializePromise;

  initializePromise = (async () => {
    try {
      const {times, sites, shoreline, frameUrls} = await loadForecastAssets();

      state.times = times.times ?? buildFallbackTimes();
      state.frameUrls = frameUrls ?? [];
      state.bounds = times.bounds ?? null;
      state.domain = times.domain ?? null;
      state.thresholds = times.thresholds ?? [-5, -3];
      state.sites = {
        names: sites.names ?? [],
        lats: sites.lats ?? [],
        lons: sites.lons ?? [],
        risk: sites.risk ?? [],
        dye: sites.dye ?? [],
        l10: sites.l10 ?? []
      };
      state.shoreline = {
        lats: shoreline.lats ?? [],
        lons: shoreline.lons ?? [],
        risk: shoreline.risk ?? []
      };

      if (!state.times.length || !state.frameUrls.length) {
        throw new Error("Forecast assets are missing.");
      }
    } catch {
      state.times = buildFallbackTimes();
      state.frameUrls = [];
      state.bounds = null;
      state.domain = null;
      state.thresholds = [-5, -3];
      state.sites = {
        names: [],
        lats: [],
        lons: [],
        risk: [],
        dye: [],
        l10: []
      };
      state.shoreline = {
        lats: [],
        lons: [],
        risk: []
      };
    }

    initialized = true;
    notify();
    return getForecastState();
  })();

  return initializePromise;
}
