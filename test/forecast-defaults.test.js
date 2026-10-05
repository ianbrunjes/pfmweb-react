import test from "node:test";
import assert from "node:assert/strict";

import {LoaderResolver} from "../node_modules/@observablehq/framework/dist/loader.js";
import {
  buildFallbackTimes,
  createEmptyShoreline,
  createEmptySites,
  createFallbackForecastState
} from "../src/data/forecast-defaults.js";
import {getForecastFileId} from "../src/state/forecast-state-utils.js";

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
  assert.deepEqual(fallback.availableFiles, []);
  assert.equal(fallback.selectedFile, "");
  assert.equal(fallback.defaultFile, "");
  assert.equal(fallback.loadingFile, false);
  assert.equal(fallback.loadError, null);
  assert.equal(fallback.thresholds.length, 2);
  assert.deepEqual(fallback.sites, createEmptySites());
  assert.deepEqual(fallback.shoreline, createEmptyShoreline());
});

test("getForecastFileId extracts timestamp identifier from NetCDF filename or path", () => {
  assert.equal(
    getForecastFileId("/dataSIO/PFM_Simulations/Archive/web/web_data_2026092000.nc"),
    "2026092000"
  );
  assert.equal(getForecastFileId("web_data_2026092600.nc"), "2026092600");
  assert.equal(getForecastFileId("2026092600"), "2026092600");
  assert.equal(getForecastFileId(""), "");
});

test("Observable LoaderResolver routes forecast file list and parameterized zip loaders", () => {
  const loaders = new LoaderResolver({root: "src"});

  const filesLoader = loaders.find("/data/forecast_files.json");
  assert.ok(filesLoader);
  assert.equal(filesLoader.path, "data/forecast_files.json.py");

  const defaultZipLoader = loaders.find("/data/pfm_his_daily.zip");
  assert.ok(defaultZipLoader);
  assert.equal(defaultZipLoader.path, "data/pfm_his_daily.zip.py");

  const paramZipLoader = loaders.find("/data/pfm_his_daily_2026092600.zip");
  assert.ok(paramZipLoader);
  assert.equal(paramZipLoader.path, "data/pfm_his_daily_[file].zip.py");
  assert.deepEqual(paramZipLoader.params, {file: "2026092600"});
  assert.ok(paramZipLoader.args.includes("--file=2026092600"));
});
