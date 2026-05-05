export function clampIndex(nextValue, itemCount) {
  const max = Math.max(0, itemCount - 1);
  return Math.max(0, Math.min(max, Number(nextValue)));
}
