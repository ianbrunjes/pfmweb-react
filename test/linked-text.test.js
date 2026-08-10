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

test("parseTemplateSegments handles official conditions placeholders", () => {
  const segments = parseTemplateSegments(
    "Current advisories can be found at {sdbeach_link}. The County also maintains the {trdash_link}.",
    {
      "{sdbeach_link}": {href: "https://cosdapps.sandiegocounty.gov/sdbeachinfo/", labelKey: "sdWaterQualityLinkLabel"},
      "{trdash_link}": {href: "https://www.sandiegocounty.gov/content/sdc/hhsa/programs/phs/community_epidemiology/south-region-health-concerns/Environmental-Dashboard.html", labelKey: "trDashLinkLabel"}
    },
    (labelKey) => ({
      sdWaterQualityLinkLabel: "County of San Diego Beach Water Quality",
      trDashLinkLabel: "Tijuana River Valley Sewage Crisis Environmental Dashboard"
    }[labelKey] ?? labelKey)
  );

  assert.deepEqual(segments, [
    {type: "text", value: "Current advisories can be found at "},
    {type: "link", href: "https://cosdapps.sandiegocounty.gov/sdbeachinfo/", label: "County of San Diego Beach Water Quality"},
    {type: "text", value: ". The County also maintains the "},
    {type: "link", href: "https://www.sandiegocounty.gov/content/sdc/hhsa/programs/phs/community_epidemiology/south-region-health-concerns/Environmental-Dashboard.html", label: "Tijuana River Valley Sewage Crisis Environmental Dashboard"},
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
