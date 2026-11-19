export function clampIndex(nextValue, itemCount) {
  const max = Math.max(0, itemCount - 1);
  return Math.max(0, Math.min(max, Number(nextValue)));
}

export function getForecastFileId(fileName) {
  return String(fileName ?? "")
    .trim()
    .replace(/^.*[/\\]/, "")
    .replace(/^web_data_/, "")
    .replace(/\.nc$/i, "");
}
