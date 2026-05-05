import test from "node:test";
import assert from "node:assert/strict";

import {
  buildFallbackTimes,
  createEmptyShoreline,
  createEmptySites,
  createFallbackForecastState
} from "../src/data/forecast-defaults.js";

test("buildFallbackTimes returns the requested frame count", () => {
  const start = new Date("2026-01-01T00:00:00Z");
  const times = buildFallbackTimes(start, 3);

  assert.equal(times.length, 3);
  assert.deepEqual(times, [
    "2026-01-01T00:00:00",
    "2026-01-01T01:00:00",
    "2026-01-01T02:00:00"
  ]);
});

test("empty forecast structures stay consistent", () => {
  assert.deepEqual(createEmptySites(), {
    names: [],
    lats: [],
    lons: [],
    risk: [],
    dye: [],
    l10: []
  });

  assert.deepEqual(createEmptyShoreline(), {
    lats: [],
    lons: [],
    risk: []
  });

  const fallback = createFallbackForecastState();
  assert.equal(fallback.thresholds.length, 2);
  assert.deepEqual(fallback.sites, createEmptySites());
  assert.deepEqual(fallback.shoreline, createEmptyShoreline());
});
