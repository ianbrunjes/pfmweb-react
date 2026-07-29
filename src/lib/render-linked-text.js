function isAllowedLinkProtocol(href, baseOrigin = "http://localhost") {
  const parsed = new URL(href, baseOrigin);
  return parsed.protocol === "https:" || parsed.protocol === "mailto:";
}

export function parseTemplateSegments(template, linksByToken, resolveLabel, baseOrigin = "http://localhost") {
  const tokenPattern = /{[a-zA-Z0-9_]+}/g;
  const segments = [];
  let cursor = 0;

  const appendText = (value) => {
    if (!value) return;
    const lastSegment = segments[segments.length - 1];
    if (lastSegment?.type === "text") {
      lastSegment.value += value;
    } else {
      segments.push({type: "text", value});
    }
  };

  for (const match of template.matchAll(tokenPattern)) {
    const token = match[0];
    const tokenStart = match.index ?? 0;

    if (tokenStart > cursor) {
      appendText(template.slice(cursor, tokenStart));
    }

    const linkConfig = linksByToken[token];
    if (!linkConfig || !isAllowedLinkProtocol(linkConfig.href, baseOrigin)) {
      appendText(token);
    } else {
      segments.push({type: "link", href: linkConfig.href, label: resolveLabel(linkConfig.labelKey)});
    }

    cursor = tokenStart + token.length;
  }

  if (cursor < template.length) {
    appendText(template.slice(cursor));
  }

  return segments;
}
