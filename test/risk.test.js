import test from "node:test";
import assert from "node:assert/strict";

import {getRiskColor, getRiskLabelKey} from "../src/lib/risk.js";
import {clampIndex} from "../src/state/forecast-state-utils.js";

test("risk helpers map known values", () => {
  assert.equal(getRiskColor(0), "palegreen");
  assert.equal(getRiskColor(1), "gold");
  assert.equal(getRiskColor(2), "firebrick");
  assert.equal(getRiskLabelKey(2), "highRisk");
});

test("risk helpers and clampIndex fall back safely", () => {
  assert.equal(getRiskColor(99), "palegreen");
  assert.equal(getRiskLabelKey(99), "lowRisk");
  assert.equal(clampIndex(-4, 5), 0);
  assert.equal(clampIndex(99, 5), 4);
  assert.equal(clampIndex(2, 0), 0);
});
