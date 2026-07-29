import test from "node:test";
import assert from "node:assert/strict";

import {parseTemplateSegments} from "../src/lib/render-linked-text.js";

test("parseTemplateSegments returns text and link segments", () => {
  const segments = parseTemplateSegments(
    "See {link} and {otherLink}.",
    {
      "{link}": {href: "https://example.com", labelKey: "guide"},
      "{otherLink}": {href: "mailto:test@example.com", labelKey: "email"}
    },
    (labelKey) => ({guide: "Guide", email: "Email"}[labelKey] ?? labelKey)
  );

  assert.deepEqual(segments, [
    {type: "text", value: "See "},
    {type: "link", href: "https://example.com", label: "Guide"},
    {type: "text", value: " and "},
    {type: "link", href: "mailto:test@example.com", label: "Email"},
    {type: "text", value: "."}
  ]);
});

test("parseTemplateSegments ignores disallowed link protocols", () => {
  const segments = parseTemplateSegments(
    "Unsafe {link}",
    {
      "{link}": {href: "javascript:alert(1)", labelKey: "guide"}
    },
    (labelKey) => labelKey,
    "https://example.test"
  );

  assert.deepEqual(segments, [{type: "text", value: "Unsafe {link}"}]);
});
