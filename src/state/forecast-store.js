import {loadForecastAssets, loadForecastFileList} from "../data/forecast-assets.js";
import {
  buildFallbackTimes,
  createEmptyShoreline,
  createEmptySites,
  createFallbackForecastState
} from "../data/forecast-defaults.js";
import {formatDateTime, t} from "../lib/i18n.js";
import {clampIndex} from "./forecast-state-utils.js";

const listeners = new Set();

let currentFrame = 0;
let currentSite = 0;
let initialized = false;
let initializePromise = null;
let activeLoadToken = 0;

const state = createFallbackForecastState();

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

function getRequestedFileFromUrl() {
  if (typeof window === "undefined") return "";
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("file") ?? "";
  } catch {
    return "";
  }
}

function syncSelectedFileToUrl(fileName) {
  if (typeof window === "undefined" || !window.history?.replaceState) return;
  try {
    const url = new URL(window.location.href);
    if (fileName && fileName !== state.defaultFile) {
      url.searchParams.set("file", fileName);
    } else {
      url.searchParams.delete("file");
    }
    window.history.replaceState(null, "", url);
  } catch {
    // Ignore URL update errors in non-browser environments
  }
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

function resetForecastData() {
  const fallback = createFallbackForecastState();
  state.times = fallback.times;
  state.frameUrls = fallback.frameUrls;
  state.bounds = fallback.bounds;
  state.domain = fallback.domain;
  state.thresholds = fallback.thresholds;
  state.sites = createEmptySites();
  state.shoreline = createEmptyShoreline();
}

function applyForecastAssets({times, sites, shoreline, frameUrls}) {
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
}

export function clampFrameIndex(nextFrame, frameCount = state.times.length) {
  return clampIndex(nextFrame, frameCount);
}

export function clampSiteIndex(nextSite, siteCount = state.sites.names.length) {
  return clampIndex(nextSite, siteCount);
}

export function getForecastState() {
  return {
    ...state,
    availableFiles: state.availableFiles,
    selectedFile: state.selectedFile,
    defaultFile: state.defaultFile,
    loadingFile: state.loadingFile,
    loadError: state.loadError,
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
  const frame = clampFrameIndex(nextFrame);
  if (frame === currentFrame) return;

  const restoreScroll = preserveScrollPosition();
  currentFrame = frame;
  notify();
  restoreScroll?.();
}

export function setCurrentSite(nextSite) {
  const site = clampSiteIndex(nextSite);
  if (site === currentSite) return;

  const restoreScroll = preserveScrollPosition();
  currentSite = site;
  notify();
  restoreScroll?.();
}

export async function setSelectedFile(nextFile) {
  const targetFile = String(nextFile ?? "").trim();
  if (!targetFile) return getForecastState();
  if (targetFile === state.selectedFile && !state.loadingFile) {
    return getForecastState();
  }

  const requestToken = ++activeLoadToken;
  const restoreScroll = preserveScrollPosition();
  state.selectedFile = targetFile;
  state.loadingFile = true;
  state.loadError = null;
  syncSelectedFileToUrl(targetFile);
  notify();

  try {
    const assets = await loadForecastAssets(targetFile, state.defaultFile);
    if (requestToken !== activeLoadToken) return getForecastState();

    applyForecastAssets(assets);
    if (!state.times.length || !state.frameUrls.length) {
      throw new Error("Forecast assets are missing.");
    }
    currentFrame = 0;
    currentSite = clampSiteIndex(currentSite);
  } catch (error) {
    if (requestToken !== activeLoadToken) return getForecastState();
    state.loadError = error instanceof Error ? error.message : "Failed to load forecast file.";
  } finally {
    if (requestToken === activeLoadToken) {
      state.loadingFile = false;
      notify();
      restoreScroll?.();
    }
  }

  return getForecastState();
}

export async function initializeForecastState() {
  if (initialized) return getForecastState();
  if (initializePromise) return initializePromise;

  initializePromise = (async () => {
    const {defaultFile, files} = await loadForecastFileList();
    state.availableFiles = files;
    state.defaultFile = defaultFile;

    const urlFile = getRequestedFileFromUrl();
    const initialFile = urlFile && files.includes(urlFile) ? urlFile : defaultFile;
    state.selectedFile = initialFile;
    state.loadingFile = true;
    state.loadError = null;

    try {
      const assets = await loadForecastAssets(initialFile, defaultFile);
      applyForecastAssets(assets);

      if (!state.times.length || !state.frameUrls.length) {
        throw new Error("Forecast assets are missing.");
      }
    } catch {
      resetForecastData();
    } finally {
      state.loadingFile = false;
    }

    initialized = true;
    notify();
    return getForecastState();
  })();

  return initializePromise;
}
