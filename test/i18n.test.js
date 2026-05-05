import test from "node:test";
import assert from "node:assert/strict";

import {interpolateTemplate} from "../src/lib/i18n.js";

test("interpolateTemplate replaces all named placeholders", () => {
  assert.equal(
    interpolateTemplate("Updated {time} for {timeZone}", {
      time: "10:00 AM",
      timeZone: "PT"
    }),
    "Updated 10:00 AM for PT"
  );
});

test("interpolateTemplate leaves unmatched placeholders alone", () => {
  assert.equal(
    interpolateTemplate("Hello {name} from {place}", {name: "team"}),
    "Hello team from {place}"
  );
});
